export default function AlianzaWordmark({
  size = 48,
  color = "#0E5DA8",
  className = "",
}) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "'Inter', 'Poppins', sans-serif",
        fontWeight: 800,
        fontSize: size,
        color: color,
        letterSpacing: "0.06em",
        lineHeight: 1.1,
        display: "block",
        textTransform: "uppercase",
      }}
    >
      ALIANZA
    </span>
  )
}