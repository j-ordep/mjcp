export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          MJCP - Sistema de Escalas
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Gerenciamento de escalas, voluntários e ministérios para igreja
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/volunteers"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Voluntários
          </a>
          <a
            href="/schedules"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Escalas
          </a>
          <a
            href="/ministries"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Ministérios
          </a>
        </div>
      </div>
    </main>
  )
}
