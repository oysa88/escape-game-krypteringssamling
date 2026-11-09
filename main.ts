function toSifre (tall: number) {
    if (tall < 10) {
        return "0" + tall
    }
    return "" + tall
}
function stoppNedtelling (tekst: string) {
    nedtelling = false
    visMelding(tekst)
    if (nedtellingFeilet) {
        neoPixelRing.showColor(neopixel.colors(NeoPixelColors.Red))
        music.play(music.tonePlayable(349, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
        music.play(music.tonePlayable(330, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
        music.play(music.tonePlayable(311, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
        music.play(music.tonePlayable(294, music.beat(BeatFraction.Double)), music.PlaybackMode.UntilDone)
    } else {
        neoPixelRing.showColor(neopixel.colors(NeoPixelColors.Green))
        music._playDefaultBackground(music.builtInPlayableMelody(Melodies.PowerUp), music.PlaybackMode.UntilDone)
    }
}
input.onButtonPressed(Button.A, function () {
    startNedtelling()
})
function erKlokketekst (tekst: string) {
    return tekst.length == 5 && tekst.charAt(2) == ":"
}
function feiletKlipping () {
    steg = -1
    for (let index = 0; index < 4; index++) {
        neoPixelKlipping.showColor(neopixel.colors(NeoPixelColors.Red))
        basic.pause(500)
        neoPixelRing.clear()
        neoPixelRing.show()
        basic.pause(500)
    }
    neoPixelKlipping.showColor(neopixel.colors(NeoPixelColors.Red))
    stoppNedtelling("BOOM!")
}
// Queue text. Only the display loop below writes to the OLED.
function visMelding (tekst: string) {
    tekstTilVisning = tekst
}
input.onButtonPressed(Button.B, function () {
    nedtellingFeilet = false
    stoppNedtelling("DESARMERT")
})
radio.onReceivedString(function (melding) {
    if (melding == "START") {
        startNedtelling()
    }
})
function startNedtelling () {
    if (nedtelling) {
        return
    }
    for (let indeks = 0; indeks <= antall_NeoPixels - 1; indeks++) {
        rodStyrke = Math.idiv(indeks * 256, antall_NeoPixels)
        neoPixelRing.setPixelColor(16 - indeks, neopixel.rgb(rodStyrke, rodStyrke, 0))
    }
    neoPixelRing.show()
    sluttTid = input.runningTime() + varighetSekunder * 1000
    sistVistSekund = -1
    startvinkel = input.rotation(Rotation.Pitch)
    startrull = input.rotation(Rotation.Roll)
    nedtelling = true
}
let tekst = ""
let sistTegnetTekst = ""
let sekunder = 0
let minutter = 0
let sekunderIgjen = 0
let tidIgjenMs = 0
let endringRoll = 0
let endringPitch = 0
let flyttetKoffert = false
let p8 = 0
let p2 = 0
let p1 = 0
let startrull = 0
let startvinkel = 0
let sluttTid = 0
let rodStyrke = 0
let steg = 0
let nedtellingFeilet = false
let nedtelling = false
let neoPixelKlipping: neopixel.Strip = null
let neoPixelRing: neopixel.Strip = null
let antall_NeoPixels = 0
let varighetTimer = 0
let varighetSekunder = 0
let tekstTilVisning = ""
let sistVistSekund = 0
pins.setPull(DigitalPin.P1, PinPullMode.PullDown)
pins.setPull(DigitalPin.P2, PinPullMode.PullDown)
pins.setPull(DigitalPin.P8, PinPullMode.PullDown)
let godkjentRFID = "DESARMERT"
sistVistSekund = -1
tekstTilVisning = "KLAR"
let varighetMinutter = 1
varighetSekunder = varighetTimer * 3600 + varighetMinutter * 60
antall_NeoPixels = 16
neoPixelRing = neopixel.create(DigitalPin.P12, antall_NeoPixels, NeoPixelMode.RGB)
neoPixelKlipping = neopixel.create(DigitalPin.P9, 3, NeoPixelMode.RGB)
neoPixelRing.clear()
neoPixelRing.show()
radio.setGroup(23)
kitronik_VIEW128x64.controlDisplayOnOff(kitronik_VIEW128x64.onOff(true))
kitronik_VIEW128x64.setFontSize(kitronik_VIEW128x64.FontSelection.Giant)
RFID_RC522.Init()
basic.forever(function () {
    if (nedtelling) {
        let rfidData = ""
        rfidData = RFID_RC522.read().trim()
if (rfidData == godkjentRFID) {
            music.stopAllSounds()
            nedtellingFeilet = false
            stoppNedtelling("DESARMERT")
        }
    }
    basic.pause(100)
})
basic.forever(function () {
    p1 = pins.digitalReadPin(DigitalPin.P1)
    p2 = pins.digitalReadPin(DigitalPin.P2)
    p8 = pins.digitalReadPin(DigitalPin.P8)
    if (steg == 0) {
        // P2 skal kobles ut først.
        if (p1 == 0 || p8 == 0) {
            feiletKlipping()
        } else if (p2 == 0) {
            steg = 1
            neoPixelKlipping.setPixelColor(0, neopixel.colors(NeoPixelColors.Green))
        }
    } else if (steg == 1) {
        // Deretter P8.
        if (p1 == 0) {
            feiletKlipping()
        } else if (p8 == 0) {
            steg = 2
            neoPixelKlipping.setPixelColor(1, neopixel.colors(NeoPixelColors.Green))
        }
    } else if (steg == 2) {
        // Til slutt P1.
        if (p1 == 0) {
            steg = 3
            neoPixelKlipping.setPixelColor(2, neopixel.colors(NeoPixelColors.Green))
        }
    }
    basic.pause(50)
})
basic.forever(function () {
    if (!(flyttetKoffert) && nedtelling) {
        endringPitch = Math.abs(input.rotation(Rotation.Pitch) - startvinkel)
        endringRoll = Math.abs(input.rotation(Rotation.Roll) - startrull)
        // Roll går fra -180 til 180 grader.
        endringRoll = Math.min(endringRoll, 360 - endringRoll)
        if (endringPitch > 10 || endringRoll > 10) {
            flyttetKoffert = true
            music.setVolume(255)
            music.play(music.tonePlayable(262, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
            music.play(music.createSoundExpression(WaveShape.Noise, 500, 3106, 255, 255, 2000, SoundExpressionEffect.None, InterpolationCurve.Linear), music.PlaybackMode.UntilDone)
        }
    }
    basic.pause(50)
})
// Count from elapsed time, independently of display work.
basic.forever(function () {
    if (nedtelling) {
        tidIgjenMs = sluttTid - input.runningTime()
        if (tidIgjenMs <= 0) {
            nedtellingFeilet = true
            stoppNedtelling("BOOM!")
        } else {
            sekunderIgjen = Math.idiv(tidIgjenMs + 999, 1000)
            if (sekunderIgjen != sistVistSekund) {
                sistVistSekund = sekunderIgjen
                minutter = Math.idiv(sekunderIgjen, 60)
                sekunder = sekunderIgjen % 60
                visMelding("" + toSifre(minutter) + ":" + toSifre(sekunder))
            }
        }
    }
    basic.pause(10)
})
// The single OLED writer prevents simultaneous clear/show operations.
basic.forever(function () {
    if (tekstTilVisning != sistTegnetTekst) {
        tekst = tekstTilVisning
        // Clock updates have the same width and overwrite their previous pixels.
        if (!(erKlokketekst(tekst) && erKlokketekst(sistTegnetTekst))) {
            kitronik_VIEW128x64.clear()
        }
        // A button/radio event may have queued a newer message during clear().
        tekst = tekstTilVisning
        kitronik_VIEW128x64.show(tekst, 1, kitronik_VIEW128x64.ShowAlign.Centre)
        sistTegnetTekst = tekst
    }
    basic.pause(10)
})
control.inBackground(function () {
    while (true) {
        if (nedtelling) {
            neoPixelRing.rotate(-1)
            neoPixelRing.show()
        }
        basic.pause(1000 / antall_NeoPixels)
    }
})
