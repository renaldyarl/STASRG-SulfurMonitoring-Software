import DashboardLayout from "./components/DashboardLayout";
import { SimulatorProvider } from "./contexts/SimulatorContext";

function App() {
    return (
        <SimulatorProvider>
            <div className="min-h-screen w-full bg-background p-4 md:p-6 flex flex-col">
                <DashboardLayout />
            </div>
        </SimulatorProvider>
    );
}

export default App;