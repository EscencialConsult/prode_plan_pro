export default function AlianzaTagline({
  size = 22,
  color = "#1696D2",
}) {
  return (
    <span
      style={{
        fontFamily: "Caveat, cursive",
        fontWeight: 700,
        fontSize: size,
        color,
      }}
    >
      Contigo por siempre
    </span>
  )
}