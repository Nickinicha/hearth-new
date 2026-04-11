export default function App() {
  return (
    <div
      style={{
        backgroundImage: `url('${import.meta.env.BASE_URL}images/forest.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: 'white',
        textShadow:
          '0 2px 8px rgba(0, 0, 0, 0.9), 0 0 2px rgba(0, 0, 0, 1)',
        fontSize: 48,
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      Hearth
    </div>
  )
}
