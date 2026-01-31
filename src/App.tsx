import React, { useMemo, useRef, useState } from 'react'
import './App.css'

type Pos = { top: number; left: number }

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export default function App() {
  const [accepted, setAccepted] = useState(false)
  const [showGif, setShowGif] = useState(false)

  const [yesButtonSize, setYesButtonSize] = useState(1.2)

  // No behavior
  const [noHasMoved, setNoHasMoved] = useState(false)
  const [noSpeed, setNoSpeed] = useState(18)
  const [noClicks, setNoClicks] = useState(0)
  const REMOVE_NO_AT_INDEX = 8

  const TRIGGER_DISTANCE = 85     // smaller = easier to catch
  const STEP_MULTIPLIER = 0.55    // less movement per dodge
  const DODGE_COOLDOWN_MS = 90    // prevents rapid-fire teleporting

  const lastDodgeRef = useRef(0)

  const playAreaRef = useRef<HTMLDivElement | null>(null)

  const [noPos, setNoPos] = useState<Pos>({ top: 55, left: 60 })

  // NEW: list of gifs from happy -> sad
  const topGifs = useMemo(
    () => [
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmNjMWZ4cW10dmJhOHNydHdka3l3YWRoZGZqemJibjVsbmVlbWFtYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Y1vXQrJoTtYRxkbQrl/giphy.gif',
      'https://media.giphy.com/media/YkKBg5mZZAa1esIpOt/giphy.gif', 
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNzlydXVkbmk2MTM4dTM1MWo5dG96ZWVkeWM1dThmMHZrdXR2MjJwYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/fX2jDeRShmnSI899XJ/giphy.gif', 
      'https://media.giphy.com/media/McmQ4uA1QcuEEqz4FI/giphy.gif',
      'https://media.giphy.com/media/QvY8iDRsmyncV7M9yh/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2RrNmNlZjRpZ3plaHlsOHVhMzgxOGdheXB6ajdqc3V5Nm02ZGxnayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/RKT8T9KuzDRER8f43d/giphy.gif',
      'https://media.giphy.com/media/jmx7wbx05HYIpEtQp3/giphy.gif',
      'https://media.giphy.com/media/l1NYpaKni2cTmT0oH7/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNnUzZGVnZHNscWUxNDBnZW10bzV4eDhldnNwM3RqOWQ5ejdxbWxvcCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/eIs3kaqiGZZf8iZlzD/giphy.gif'
    ],
    []
  )

  // pick gif based on noClicks (cap at last gif)
  const topGifSrc = topGifs[Math.min(noClicks, topGifs.length - 1)]

  const celebrationGif = useMemo(
    () => 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdzdnOGgwMThxOTJncTQ2eHlwcndvdThlaTl0bm9jNjFldjlidzZ1YSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/j4jfoGbNQn1FoAEmsN/giphy.gif',
    []
  )

  const noMessages = useMemo(
    () => [
      'Will you be my Valentine?',
      'Are you sure...?',
      'Bruh be fr now. Try again.',
      'Bro stop it 😭',
      'This is rude.',
      'Nandika. Please.',
      'Do you even love me...',
      'Last chance... please?',
      'That’s it. I’m gonna take the No away.',
    ],
    []
  )

  const titleIndex = Math.min(noClicks, noMessages.length - 1)
  const titleText = noMessages[titleIndex]
  const shouldRemoveNo = titleIndex >= REMOVE_NO_AT_INDEX

  const handleYesClick = () => {
    setAccepted(true)
    setShowGif(true)
  }

  const randomizeNoPosition = () => {
    const SAFE_MIN_LEFT = 35
    const SAFE_MAX_LEFT = 65
    const SAFE_MIN_TOP = 35
    const SAFE_MAX_TOP = 70

    let newTop = Math.random() * 80 + 10
    let newLeft = Math.random() * 80 + 10

    const inSafeBox =
      newLeft >= SAFE_MIN_LEFT &&
      newLeft <= SAFE_MAX_LEFT &&
      newTop >= SAFE_MIN_TOP &&
      newTop <= SAFE_MAX_TOP

    if (inSafeBox) {
      newLeft = newLeft < 50 ? 12 : 88
      newTop = newTop < 55 ? 15 : 85
    }

    setNoPos({
      top: clamp(newTop, 6, 94),
      left: clamp(newLeft, 6, 94),
    })
  }

  const handleNoClick = () => {
    setNoHasMoved(true)

    // BIGGER yes growth each time
    setYesButtonSize((s) => s + 0.18 + noClicks * 0.03)

    // IMPORTANT: increment noClicks (drives message + gif)
    setNoClicks((c) => c + 1)

    // faster dodge each click
    setNoSpeed((s) => s + 6)

    randomizeNoPosition()
  }

  const handleNoMouseMove = (e: React.MouseEvent) => {
    if (!noHasMoved || accepted) return
    const area = playAreaRef.current
    if (!area) return

    const now = Date.now()
    if (now - lastDodgeRef.current < DODGE_COOLDOWN_MS) return

    const rect = area.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const noX = (noPos.left / 100) * rect.width
    const noY = (noPos.top / 100) * rect.height

    const dx = noX - mouseX
    const dy = noY - mouseY
    const dist = Math.sqrt(dx * dx + dy * dy) || 1

    // only dodge when you're CLOSE
    if (dist > TRIGGER_DISTANCE) return

    const ux = dx / dist
    const uy = dy / dist

    // move less per dodge (and scale with speed but dampened)
    const step = noSpeed * STEP_MULTIPLIER

    const nextX = clamp(noX + ux * step, 40, rect.width - 40)
    const nextY = clamp(noY + uy * step, 35, rect.height - 35)

    lastDodgeRef.current = now

    setNoPos({
      left: (nextX / rect.width) * 100,
      top: (nextY / rect.height) * 100,
    })
  }


  return (
    <div className="app-container">
      <div className="content">
        {!accepted && (
          <>
            <img className="top-gif" src={topGifSrc} alt="mood gif" />

            <h1 className="title">Will you be my Valentine?</h1>

            <p className="subtitle">
              {titleText !== 'Will you be my Valentine?' && titleText}
            </p>
          </>
        )}

        <div className="button-row">
          {!accepted && (
            <button
            className="yes-button"
            onClick={handleYesClick}
            style={{ transform: `scale(${yesButtonSize})` }}
          >
            Yes
          </button>
        )}
          

          {!accepted && !noHasMoved && !shouldRemoveNo && (
            <button className="no-button" onClick={handleNoClick}>
              No
            </button>
          )}
        </div>

        {!accepted && noHasMoved && !shouldRemoveNo && (
          <div
            className="play-area-full"
            ref={playAreaRef}
            onMouseMove={handleNoMouseMove}
          >
            <button
              className="no-button"
              onClick={handleNoClick}
              style={{
                position: 'absolute',
                top: `${noPos.top}%`,
                left: `${noPos.left}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              No
            </button>
          </div>
        )}

        {showGif && (
          <div className="celebration">
            <img
              className="celebration-gif"
              src={celebrationGif}
              alt="Celebration"
            />
            <p className="success-text">YAYYY I LOVE YOU SWEETIE 💖</p>
          </div>
        )}
      </div>
    </div>
  )
}
