import React from "react";
import { Info, AlertTriangle, Wind, MapPin, ShieldAlert } from "lucide-react";

const InfoPage = () => {
    return (
        <div className="space-y-8 pb-8 max-w-5xl">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Info className="w-6 h-6 text-blue-600" />
                    Pusat Informasi & Keselamatan
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Panduan membaca dashboard dan informasi bahaya gas vulkanik di area Kawah Putih.
                </p>
            </div>

            {/* Tentang Sistem */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">Tentang Sistem Monitoring Gas Kawah Putih</h2>
                <p className="text-sm text-gray-600 leading-relaxed text-justify">
                    Sistem monitoring gas vulkanik adalah platform pemantauan kualitas udara dan gas vulkanik secara 
                    real-time di kawasan Kawah Putih. Sistem ini mengandalkan jaringan sensor IoT yang mendeteksi 
                    konsentrasi gas berbahaya, suhu, kelembapan, serta arah dan kecepatan angin. 
                    Tujuan utamanya adalah memberikan peringatan dini (early warning) demi keselamatan pengunjung dan petugas.
                </p>
            </div>

            {/* Edukasi Gas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SO2 Card */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <h3 className="text-md font-bold text-amber-900">Gas SO₂ (Sulfur Dioksida)</h3>
                    </div>
                    <div className="text-sm text-amber-800 space-y-3">
                        <p>
                            <strong>Karakteristik:</strong> Gas tidak berwarna dengan bau menyengat seperti korek api yang terbakar.
                        </p>
                        <p>
                            <strong>Bahaya:</strong> Menyebabkan iritasi parah pada mata, hidung, dan tenggorokan. 
                            Paparan tinggi dapat menyebabkan sesak napas.
                        </p>
                        <div className="bg-white p-3 rounded-lg border border-amber-100 mt-4">
                            <span className="block text-xs uppercase font-bold text-amber-600 mb-1">Ambang Batas Waspada</span>
                            <span className="text-xl font-mono font-bold text-amber-700">&gt; 5.0 µg/m³</span>
                        </div>
                    </div>
                </div>

                {/* H2S Card */}
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <ShieldAlert className="w-5 h-5 text-red-600" />
                        <h3 className="text-md font-bold text-red-900">Gas H₂S (Hidrogen Sulfida)</h3>
                    </div>
                    <div className="text-sm text-red-800 space-y-3">
                        <p>
                            <strong>Karakteristik:</strong> Gas sangat beracun dan mudah terbakar, dikenali dari bau menyengat seperti telur busuk.
                        </p>
                        <p>
                            <strong>Bahaya:</strong> Pada konsentrasi rendah menyebabkan sakit kepala. 
                            Pada konsentrasi sangat tinggi dapat menghilangkan indera penciuman dan mematikan dalam waktu singkat.
                        </p>
                        <div className="bg-white p-3 rounded-lg border border-red-100 mt-4">
                            <span className="block text-xs uppercase font-bold text-red-600 mb-1">Ambang Batas Waspada</span>
                            <span className="text-xl font-mono font-bold text-red-700">&gt; 2.0 µg/m³</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Panduan Peta */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Panduan Membaca Peta (Dashboard)</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex gap-4">
                        <div className="mt-1">
                            <MapPin className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-800">Pin Biru (Sensor Aktif)</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Menandakan bahwa titik sensor tersebut sedang hidup dan aktif mengirimkan data gas ke server.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="mt-1">
                            <MapPin className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-800">Pin Abu-abu (Sensor Mati)</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Menandakan sensor mati listrik, kehilangan sinyal, atau sedang dalam perbaikan (offline).
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 sm:col-span-2">
                        <div className="mt-1">
                            <Wind className="w-6 h-6 text-teal-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-800">Visualisasi Angin (Awan Bergerak)</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Garis atau kabut awan yang melintas di atas peta bukanlah hiasan, melainkan visualisasi langsung dari 
                                arah angin dan kecepatannya. Arah gerakan awan menunjukkan kemana udara/gas saat ini sedang berhembus.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default InfoPage;
