export default function AlianzaMark({
  size = 80,
  className = "",
  color,
}) {
  const isWhite = color === "#fff" || color === "white"
  const src = isWhite ? "/imgprode/alianza_mark_white.png" : "/imgprode/alianza_mark.png"

  return (
    <img
      src={src}
      alt="Alianza"
      className={className}
      style={{
        width: size,
        height: "auto",
        display: "block",
      }}
    />
  )
}