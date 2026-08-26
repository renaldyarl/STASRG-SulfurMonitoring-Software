# Sulfur Monitoring Stack — Network Security Configuration

## 1. Tujuan

Dokumen ini mendefinisikan baseline konfigurasi dan pengujian network security untuk `sulfur_monitoring_stack`.

Tujuan utama:

* Memisahkan network frontend, backend, dan database.
* Mencegah database dapat diakses langsung dari frontend atau Internet.
* Mencegah backend diekspos langsung ke Internet.
* Menempatkan Nginx/reverse proxy sebagai public entry point.
* Membatasi komunikasi antar-container berdasarkan kebutuhan.
* Mengontrol koneksi outbound (egress) dari backend.
* Menyediakan baseline untuk pengujian dan hardening bertahap.

---

## 2. Target Topologi

```text
                         INTERNET
                            │
                            ▼
                    ┌──────────────┐
                    │     NGINX    │
                    │ Public Edge  │
                    │    :80/:443  │
                    └──────┬───────┘
                           │
                    internal_net
                           │
                    ┌──────▼───────┐
                    │    BACKEND    │
                    │   :8000       │
                    │   PRIVATE     │
                    └──────┬────────┘
                           │
                        db_net
                           │
                    ┌──────▼───────┐
                    │  POSTGRESQL   │
                    │    :5432      │
                    │    PRIVATE   │
                    └──────────────┘
```

Prinsip:

```text
Internet → Nginx → Backend → PostgreSQL
```

Bukan:

```text
Internet → Backend
Internet → PostgreSQL
Frontend → PostgreSQL
```

---

## 3. Network Segmentation

Stack menggunakan minimal dua network:

### `internal_net`

Digunakan untuk komunikasi:

```text
NGINX
  ↓
Backend
  ↓
Frontend
```

Contoh:

```text
172.24.0.0/16
```

### `db_net`

Digunakan untuk komunikasi database:

```text
Backend
   ↓
PostgreSQL
```

Contoh:

```text
172.25.0.0/16
```

PostgreSQL tidak boleh menjadi anggota `internal_net` apabila frontend tidak membutuhkan akses database secara langsung.

---

## 4. Network Membership

Target membership:

| Container  | internal_net | db_net | Public |
| ---------- | -----------: | -----: | -----: |
| Nginx      |          YES |     NO |    YES |
| Frontend   |          YES |     NO |    NO* |
| Backend    |          YES |    YES |     NO |
| PostgreSQL |           NO |    YES |     NO |

`*` Frontend dapat dipublish melalui Nginx/reverse proxy, tetapi tidak perlu mengekspos port internal secara langsung jika arsitektur menggunakan Nginx sebagai entry point.

---

## 5. Communication Matrix

| Source     | Destination |   Port | Policy                |
| ---------- | ----------- | -----: | --------------------- |
| Internet   | Nginx       | 80/443 | ALLOW                 |
| Nginx      | Backend     |   8000 | ALLOW                 |
| Frontend   | Backend     |   8000 | ALLOW jika diperlukan |
| Backend    | PostgreSQL  |   5432 | ALLOW                 |
| Frontend   | PostgreSQL  |   5432 | DENY                  |
| Internet   | Backend     |   8000 | DENY                  |
| Internet   | PostgreSQL  |   5432 | DENY                  |
| Host       | Backend     |   8000 | DENY                  |
| Backend    | Internet    | 80/443 | DENY*                 |
| PostgreSQL | Internet    |    ANY | DENY*                 |

`*` Dapat dibuat allowlist apabila aplikasi membutuhkan external service tertentu.

---

## 6. Backend Network Policy

Backend harus:

* Tidak memiliki `ports:` yang dipublish ke host.
* Tidak menggunakan `network_mode: host`.
* Tidak menggunakan `privileged: true`.
* Tidak diberikan akses network yang tidak diperlukan.
* Hanya bergabung dengan network yang memang dibutuhkan.
* Menggunakan internal DNS Docker untuk komunikasi service-to-service.

Contoh:

```yaml
backend:
  expose:
    - "8000"

  networks:
    - internal_net
    - db_net
```

Hindari:

```yaml
backend:
  ports:
    - "8000:8000"
```

karena ini membuat port backend tersedia melalui host.

---

## 7. Database Network Policy

PostgreSQL hanya berada di `db_net`.

```yaml
postgres:
  networks:
    - db_net
```

Jangan:

```yaml
postgres:
  ports:
    - "5432:5432"
```

Database seharusnya tidak memiliki public port.

Backend mengakses database menggunakan:

```text
postgres:5432
```

atau nama service yang digunakan dalam Compose.

Jangan menggunakan IP container secara hardcoded.

---

## 8. Nginx / Reverse Proxy

Nginx menjadi public entry point.

Contoh:

```text
Client
  ↓
HTTPS :443
  ↓
NGINX
  ↓
http://backend:8000
```

Backend tidak perlu mengetahui public IP client secara langsung untuk routing dasar.

Nginx bertanggung jawab terhadap:

* TLS termination.
* Reverse proxy.
* Request size limit.
* Connection timeout.
* Rate limiting.
* Security headers.
* Access logging.
* Routing API.

---

## 9. Backend Inbound Policy

Backend harus menerima request hanya dari network/service yang diperlukan.

Target:

```text
NGINX → Backend:8000      ALLOW
Frontend → Backend:8000   ALLOW jika diperlukan
Internet → Backend:8000   DENY
```

Verifikasi:

```bash
docker port sulfur_backend
```

Expected:

```text
(no output)
```

Kemudian:

```bash
curl -I http://localhost:8000
```

Expected:

```text
connection refused / no response
```

---

## 10. Backend Egress Policy

Default policy yang disarankan:

```text
Backend → Internet = DENY
```

Kecuali backend membutuhkan external service.

Jika membutuhkan external API, gunakan allowlist:

```text
Backend → api.example.com:443 = ALLOW
Backend → other Internet       = DENY
```

Jangan menggunakan:

```text
Backend → 0.0.0.0/0 = ALLOW
```

tanpa kebutuhan yang jelas.

---

## 11. DNS Policy

Service harus menggunakan Docker internal DNS.

Contoh:

```text
sulfur_backend → sulfur_postgres
```

bukan:

```text
172.25.0.2
```

Tes:

```bash
docker exec sulfur_backend getent hosts sulfur_postgres
```

Expected:

```text
172.25.0.x sulfur_postgres
```

Frontend tidak seharusnya dapat resolve database:

```bash
docker exec sulfur_frontend getent hosts sulfur_postgres
```

Expected:

```text
temporary failure / not found
```

---

## 12. Connectivity Testing

### Frontend → Backend

```bash
docker exec sulfur_frontend wget -qO- http://sulfur_backend:8000/
```

Expected:

```text
HTTP response
```

### Backend → PostgreSQL

```bash
docker exec sulfur_backend python -c \
"import socket; print(socket.create_connection(('sulfur_postgres',5432),5))"
```

Expected:

```text
socket connection
```

### Frontend → PostgreSQL

```bash
docker exec sulfur_frontend wget -qO- http://sulfur_postgres:5432
```

Expected:

```text
DNS resolution failure / connection failure
```

### PostgreSQL → Backend

```bash
docker exec sulfur_postgres wget -qO- http://sulfur_backend:8000/
```

Expected:

```text
HTTP response
```

Jika PostgreSQL tidak membutuhkan akses HTTP ke backend, komunikasi ini sebaiknya kemudian dibatasi.

---

## 13. Host Exposure Testing

Periksa:

```bash
docker port sulfur_backend
```

Expected:

```text
(no output)
```

Periksa semua published ports:

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}'
```

Backend dan PostgreSQL seharusnya tidak memiliki public port.

---

## 14. Network Inspection

Periksa network:

```bash
docker network ls
```

Detail network:

```bash
docker network inspect sulfur_monitoring_stack_internal_net
```

```bash
docker network inspect sulfur_monitoring_stack_db_net
```

Periksa membership:

```bash
docker inspect sulfur_backend \
  --format '{{json .NetworkSettings.Networks}}'
```

```bash
docker inspect sulfur_frontend \
  --format '{{json .NetworkSettings.Networks}}'
```

```bash
docker inspect sulfur_postgres \
  --format '{{json .NetworkSettings.Networks}}'
```

---

## 15. Container Privilege Baseline

Container tidak boleh menggunakan privilege yang tidak diperlukan.

Periksa:

```bash
docker inspect sulfur_backend \
  --format 'Privileged={{.HostConfig.Privileged}}'
```

Expected:

```text
Privileged=false
```

Periksa user:

```bash
docker inspect sulfur_backend \
  --format 'User={{.Config.User}}'
```

Backend sebaiknya tidak berjalan sebagai root.

---

## 16. Host Network Check

Backend tidak boleh menggunakan host network.

Periksa:

```bash
docker inspect sulfur_backend \
  --format 'NetworkMode={{.HostConfig.NetworkMode}}'
```

Expected:

```text
NetworkMode=<compose network>
```

Bukan:

```text
host
```

---

## 17. Published Port Audit

Periksa seluruh container:

```bash
docker ps --format \
'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
```

Target:

```text
NGINX       → 80/443
Frontend    → internal only
Backend     → internal only
PostgreSQL  → internal only
```

---

## 18. Egress Verification

Tes dari backend:

```bash
docker exec sulfur_backend python -c \
"import urllib.request; print(urllib.request.urlopen('https://example.com', timeout=5).status)"
```

Jika backend memang harus isolated:

```text
Expected:
connection failure / timeout
```

Jika backend membutuhkan external API:

```text
Expected:
only explicitly allowed destinations are reachable
```

---

## 19. Default Security Principle

Gunakan prinsip:

```text
DENY BY DEFAULT
ALLOW BY REQUIREMENT
```

Artinya:

1. Jangan membuka network karena "mungkin dibutuhkan".
2. Tentukan komunikasi yang dibutuhkan.
3. Izinkan hanya komunikasi tersebut.
4. Uji komunikasi yang seharusnya ditolak.
5. Dokumentasikan hasilnya.
6. Uji ulang setelah perubahan konfigurasi.

---

## 20. Security Verification Checklist

### Network

* [ ] Backend tidak memiliki published port.
* [ ] PostgreSQL tidak memiliki published port.
* [ ] PostgreSQL tidak berada pada frontend network.
* [ ] Frontend tidak dapat resolve PostgreSQL.
* [ ] Frontend dapat mengakses endpoint backend yang diperlukan.
* [ ] Backend dapat mengakses PostgreSQL.
* [ ] Nginx dapat mengakses backend.
* [ ] Internet tidak dapat mengakses backend secara langsung.
* [ ] Internet tidak dapat mengakses PostgreSQL.
* [ ] Backend tidak memiliki unrestricted Internet egress.
* [ ] PostgreSQL tidak memiliki unrestricted Internet egress.

### Container

* [ ] Backend tidak `privileged`.
* [ ] PostgreSQL tidak `privileged`.
* [ ] Backend tidak menggunakan host network.
* [ ] PostgreSQL tidak menggunakan host network.
* [ ] Container tidak berjalan sebagai root tanpa alasan.
* [ ] Capabilities tidak diberikan secara berlebihan.
* [ ] Filesystem permissions telah diperiksa.

### Application

* [ ] API authentication aktif.
* [ ] Authorization/RBAC aktif.
* [ ] Rate limiting tersedia pada public API.
* [ ] CORS dibatasi.
* [ ] Request validation aktif.
* [ ] Upload validation aktif jika terdapat file upload.
* [ ] Error response tidak membocorkan secret/internal path.
* [ ] Swagger/OpenAPI tidak diekspos tanpa pertimbangan keamanan pada production.

### Secrets

* [ ] Credential tidak berada di source code.
* [ ] Credential tidak berada di Dockerfile.
* [ ] Credential tidak berada di image layer.
* [ ] `.env` tidak masuk Git.
* [ ] Secret lama telah di-rotate jika pernah terekspos.
* [ ] Docker build cache diperiksa apabila credential pernah masuk layer.

---

## 21. Current Sulfur Baseline

Berdasarkan pengujian awal:

```text
Frontend → Backend       PASS
Backend → PostgreSQL     PASS
PostgreSQL → Backend     PASS
Frontend → PostgreSQL    BLOCKED
Host → Backend:8000      BLOCKED
Backend → Internet       CURRENTLY ALLOWED
```

Status:

```text
Network segmentation:
PARTIALLY HARDENED

Backend inbound:
ISOLATED

Database exposure:
ISOLATED

Backend egress:
NOT YET RESTRICTED
```

Jangan menganggap stack production-ready sebelum seluruh policy di atas diuji.

---

## 22. Hardening Sequence

Urutan pengerjaan yang disarankan:

```text
1. Inventory
   ↓
2. Network mapping
   ↓
3. Connectivity matrix
   ↓
4. Remove unnecessary published ports
   ↓
5. Separate frontend/backend/database networks
   ↓
6. Configure Nginx as public entry point
   ↓
7. Restrict backend egress
   ↓
8. Restrict container privileges
   ↓
9. Secure database
   ↓
10. Secure API authentication/authorization
   ↓
11. Secrets rotation
   ↓
12. Logging and monitoring
   ↓
13. Retest
```

Setiap perubahan network harus diikuti pengujian:

```text
ALLOW test
+
DENY test
```

Tujuannya bukan hanya memastikan service **bisa berkomunikasi**, tetapi juga memastikan service **yang seharusnya tidak bisa berkomunikasi benar-benar tidak bisa**.
