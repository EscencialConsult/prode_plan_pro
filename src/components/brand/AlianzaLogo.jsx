export default function AlianzaLogo({
  size = 220,
  light = false,
  className = "",
}) {
  // Use the cropped transparent PNGs directly
  const src = light ? "/imgprode/alianza_logo_light_text.png" : "/imgprode/alianza_logo_full.png"

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <img
        src={src}
        alt="Alianza Grupo Asegurador"
        style={{
          width: size,
          height: "auto",
          display: "block",
        }}
      />
    </div>
  )
}