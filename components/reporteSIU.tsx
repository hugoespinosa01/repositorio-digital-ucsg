export default function ReporteSIU ({printRef} : {printRef: any}) {
    return (
        <div ref={printRef} className="min-h-screen p-8 flex flex-col items-center">
            <div className="bg-white shadow-lg rounded-lg p-6">
                Hola
            </div>
        </div>
    )
}