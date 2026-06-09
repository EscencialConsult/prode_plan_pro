import React from 'react'
import { BRAND } from '../../brand.js'

export default function Logo({ variant = 'full', size = 48, className = '', alt, style, tone, ...props }) {
  const altText = alt ?? BRAND.logoAlt
  const numericSize = typeof size === 'number' ? size : 48
  const height = typeof size === 'number' ? `${size}px` : size
  const isWhite = tone === 'white'
  const textColor = isWhite ? '#FFFFFF' : BRAND.text
  const subColor = isWhite ? 'rgba(255,255,255,.68)' : BRAND.textMuted

  const rootStyle = {
    height,
    display: 'inline-flex',
    alignItems: 'center',
    gap: Math.max(8, numericSize * .18),
    maxWidth: '100%',
    color: textColor,
    lineHeight: 1,
    verticalAlign: 'middle',
    textDecoration: 'none',
    ...(style || {}),
  }

  const markSize = `${numericSize * .9}px`
  const cropScale = 1.55

  return (
    <span className={className} style={rootStyle} aria-label={altText} role="img" {...props}>
      <span
        aria-hidden="true"
        style={{
          width: markSize,
          height: markSize,
          position: 'relative',
          overflow: 'hidden',
          flex: '0 0 auto',
          display: 'inline-block',
          borderRadius: 2,
        }}
      >
        <img
          src={BRAND.logoMarkPath}
          alt=""
          style={{
            position: 'absolute',
            width: `${numericSize * .9 * cropScale}px`,
            height: `${numericSize * .9 * cropScale}px`,
            left: '50%',
            top: '45%',
            transform: 'translate(-50%, -50%)',
            objectFit: 'contain',
            display: 'block',
            filter: isWhite ? 'drop-shadow(0 5px 14px rgba(0,0,0,.28))' : 'none',
          }}
        />
      </span>

      {variant !== 'mark' && (
        <span style={{ display: 'inline-flex', flexDirection: 'column', gap: Math.max(1, numericSize * .04), minWidth: 0 }}>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontWeight: 900,
              fontSize: `${numericSize * .48}px`,
              letterSpacing: 0,
              color: textColor,
              whiteSpace: 'nowrap',
            }}
          >
            Bercovich
          </span>
          {numericSize >= 34 && (
            <span
              style={{
                width: '100%',
                height: Math.max(2, Math.round(numericSize * .055)),
                background: BRAND.accent,
                borderRadius: 999,
                boxShadow: isWhite ? '0 0 18px rgba(227,6,19,.28)' : 'none',
              }}
            />
          )}
          {numericSize >= 48 && (
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: `${numericSize * .13}px`,
                color: subColor,
                letterSpacing: 0,
                whiteSpace: 'nowrap',
              }}
            >
              Materiales para obra y hogar
            </span>
          )}
        </span>
      )}
    </span>
  )
}
