import { Button, ChatHeader, AvailableRideCard } from "@waymate/ui";

function App() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center gap-8 bg-slate-100">
            <div className="rounded-xl bg-white p-8 shadow-md text-center">
                <h1 className="text-4xl font-bold text-slate-900">Waymate</h1>
                <p className="mt-4 text-lg text-slate-600">
                    Frontend foundation with Tailwind CSS is running.
                </p>
                <Button
                    className="mt-6"
                    onClick={() => alert("Hello, Waymate!")}
                >
                    Click Me
                </Button>
            </div>
        </main>
    );
}

export default App;
