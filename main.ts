// Varighet for testen. Sett varighetTimer = 1 og varighetMinutter = 30 for 90 min.
let varighetTimer = 0
let varighetMinutter = 1
let varighetSekunder = varighetTimer * 3600 + varighetMinutter * 60
let antallNeoPixels = 16
let godkjentRFID = "DESARMERT"
// Bytt til nummeret elevene skal finne. Behold anførselstegnene.
let riktigTelefonnummer = "019"
let telefonServoPinne = AnalogPin.P10
let telefonServoLukket = 0
let telefonServoApen = 180

let nedtelling = false
let avslutterRunde = false
let sluttTid = 0
let sistVistSekund = -1
let steg = 0
let flyttetKoffert = false
let startvinkel = 0
let startrull = 0
let nummer = ""
let pulser = 0
let telefonOppgaveLost = false
let rfidOppgaveLost = false
let seierssignalAktivt = false
let seierssignaler: string[] = []
let tekstTilVisning = "KLAR"
let sistTegnetTekst = ""
let sistTegnetNummer = ""

led.enable(false)
pins.setPull(DigitalPin.P3, PinPullMode.PullDown)
pins.setPull(DigitalPin.P6, PinPullMode.PullDown)
pins.setPull(DigitalPin.P1, PinPullMode.PullDown)
pins.setPull(DigitalPin.P2, PinPullMode.PullDown)
pins.setPull(DigitalPin.P8, PinPullMode.PullDown)

let neoPixelRing = neopixel.create(DigitalPin.P12, antallNeoPixels, NeoPixelMode.RGB)
let neoPixelKlipping = neopixel.create(DigitalPin.P9, 3, NeoPixelMode.RGB)
neoPixelRing.clear()
neoPixelRing.show()
neoPixelKlipping.clear()
neoPixelKlipping.show()

pins.servoWritePin(AnalogPin.P4, 0)
pins.servoWritePin(telefonServoPinne, telefonServoLukket)
radio.setGroup(23)
kitronik_VIEW128x64.controlDisplayOnOff(kitronik_VIEW128x64.onOff(true))
RFID_RC522.Init()

function toSifre(tall: number): string {
    if (tall < 10) {
        return "0" + tall
    }
    return "" + tall
}

function erKlokketekst(tekst: string): boolean {
    return tekst.length == 5 && tekst.charAt(2) == ":"
}

function tegnNedtellingsring() {
    for (let indeks = 0; indeks < antallNeoPixels; indeks++) {
        let styrke = Math.idiv(indeks * 256, antallNeoPixels)
        neoPixelRing.setPixelColor(
            antallNeoPixels - 1 - indeks,
            neopixel.rgb(styrke, styrke, 0)
        )
    }
    neoPixelRing.show()
}

function startNedtelling() {
    if (nedtelling || avslutterRunde) {
        return
    }

    steg = 0
    flyttetKoffert = false
    nummer = ""
    pulser = 0
    telefonOppgaveLost = false
    rfidOppgaveLost = false
    pins.servoWritePin(telefonServoPinne, telefonServoLukket)
    neoPixelKlipping.clear()
    neoPixelKlipping.show()
    tegnNedtellingsring()

    startvinkel = input.rotation(Rotation.Pitch)
    startrull = input.rotation(Rotation.Roll)
    sistVistSekund = -1
    sluttTid = input.runningTime() + varighetSekunder * 1000
    nedtelling = true
}

function stoppNedtelling(tekst: string, feilet: boolean) {
    avslutterRunde = true
    nedtelling = false
    if (telefonOppgaveLost) {
        nummer = ""
    }
    seierssignalAktivt = false
    seierssignaler = []
    tekstTilVisning = tekst
    music.stopAllSounds()

    if (feilet) {
        neoPixelRing.showColor(neopixel.colors(NeoPixelColors.Red))
        music.play(music.tonePlayable(349, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
        music.play(music.tonePlayable(330, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
        music.play(music.tonePlayable(311, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
        music.play(music.tonePlayable(294, music.beat(BeatFraction.Double)), music.PlaybackMode.UntilDone)

        if (steg == -1) {
            for (let blink = 0; blink < 4; blink++) {
                neoPixelKlipping.showColor(neopixel.colors(NeoPixelColors.Red))
                basic.pause(500)
                neoPixelKlipping.clear()
                neoPixelKlipping.show()
                basic.pause(500)
            }
            neoPixelKlipping.showColor(neopixel.colors(NeoPixelColors.Red))
        }
    } else {
        neoPixelRing.showColor(neopixel.colors(NeoPixelColors.Green))
        music.play(music.builtInPlayableMelody(Melodies.PowerUp), music.PlaybackMode.UntilDone)
    }

    avslutterRunde = false
}

function feiletKlipping() {
    steg = -1
    stoppNedtelling("BOOM!", true)
}

input.onButtonPressed(Button.A, function () {
    startNedtelling()
})

radio.onReceivedString(function (melding) {
    if (melding == "START") {
        startNedtelling()
    }
})

function spillSeierssignal() {
    seierssignalAktivt = true
    music.stopAllSounds()
    let seiertoner = [523, 659, 784, 1047]
    for (let tone of seiertoner) {
        if (!seierssignalAktivt) {
            return
        }
        neoPixelRing.showColor(neopixel.colors(NeoPixelColors.Green))
        music.play(music.tonePlayable(tone, 250), music.PlaybackMode.InBackground)
        basic.pause(250)

        if (!seierssignalAktivt) {
            return
        }
        neoPixelRing.clear()
        neoPixelRing.show()
        basic.pause(250)
    }

    if (seierssignalAktivt) {
        tegnNedtellingsring()
        seierssignalAktivt = false
    }
}

function losTelefonoppgave() {
    telefonOppgaveLost = true
    pins.servoWritePin(telefonServoPinne, telefonServoApen)
    seierssignaler.push("telefon")
}

// Telefonskive på P3. Den hvite knappen på P6 tømmer nummeret.
control.inBackground(function () {
    let forrigeNiva = pins.digitalReadPin(DigitalPin.P3)
    let forrigeKnappNiva = pins.digitalReadPin(DigitalPin.P6)
    let sistePulsTid = 0

    serial.writeValue("P3 ved oppstart", forrigeNiva)
    serial.writeValue("P6 ved oppstart", forrigeKnappNiva)

    while (true) {
        let niva = pins.digitalReadPin(DigitalPin.P3)
        let knappNiva = pins.digitalReadPin(DigitalPin.P6)
        let na = input.runningTime()

        if (!telefonOppgaveLost && forrigeKnappNiva == 0 && knappNiva == 1) {
            nummer = ""
            pulser = 0
            serial.writeLine("Nummer tomt etter knappetrykk")
        } else if (!telefonOppgaveLost) {
            // Ignorer nye stigende flanker innen 15 ms etter en puls.
            if (forrigeNiva == 0 && niva == 1 &&
                (pulser == 0 || na - sistePulsTid >= 15)) {
                pulser += 1
                sistePulsTid = na
            }

            if (pulser > 0 && na - sistePulsTid >= 500) {
                if (pulser <= 10) {
                    let siffer = 10 - pulser
                    nummer = nummer + siffer
                    serial.writeLine("Nummer: " + nummer)
                    if (nedtelling && nummer == riktigTelefonnummer) {
                        losTelefonoppgave()
                    }
                } else {
                    serial.writeValue("Avvist pulstall", pulser)
                }
                pulser = 0
            }
        }

        forrigeNiva = niva
        forrigeKnappNiva = knappNiva
        basic.pause(2)
    }
})

// All tegning på OLED skjer i denne løkka.
basic.forever(function () {
    let hovedtekst = tekstTilVisning
    let telefonnummer = nummer
    let hovedtekstEndret = hovedtekst != sistTegnetTekst
    let telefonnummerForkortet = telefonnummer.length < sistTegnetNummer.length
    let tomSkjerm = telefonnummerForkortet || (hovedtekstEndret &&
        !(erKlokketekst(hovedtekst) && erKlokketekst(sistTegnetTekst)))

    if (tomSkjerm) {
        kitronik_VIEW128x64.clear()
    }

    if (hovedtekstEndret || tomSkjerm) {
        if (erKlokketekst(hovedtekst)) {
            kitronik_VIEW128x64.setFontSize(kitronik_VIEW128x64.FontSelection.Giant)
            kitronik_VIEW128x64.show(hovedtekst, 1, kitronik_VIEW128x64.ShowAlign.Centre)
        } else {
            kitronik_VIEW128x64.setFontSize(kitronik_VIEW128x64.FontSelection.Big)
            kitronik_VIEW128x64.show(hovedtekst, 2, kitronik_VIEW128x64.ShowAlign.Centre)
        }
        sistTegnetTekst = hovedtekst
    }

    if (telefonnummer.length > 0 && (tomSkjerm || telefonnummer != sistTegnetNummer)) {
        let topplinje = ("Nummer: " + telefonnummer).substr(0, 25)
        kitronik_VIEW128x64.setFontSize(kitronik_VIEW128x64.FontSelection.Normal)
        kitronik_VIEW128x64.show(topplinje, 1, kitronik_VIEW128x64.ShowAlign.Left)
    }
    sistTegnetNummer = telefonnummer

    basic.pause(10)
})

basic.forever(function () {
    if (nedtelling && !rfidOppgaveLost) {
        let rfidData = RFID_RC522.read().trim()
        if (nedtelling && rfidData == godkjentRFID) {
            rfidOppgaveLost = true
            pins.servoWritePin(AnalogPin.P4, 180)
            seierssignaler.push("rfid")
        }
    }
    basic.pause(100)
})

basic.forever(function () {
    if (nedtelling) {
        let p1 = pins.digitalReadPin(DigitalPin.P1)
        let p2 = pins.digitalReadPin(DigitalPin.P2)
        let p8 = pins.digitalReadPin(DigitalPin.P8)

        if (steg == 0) {
            if (p1 == 0 || p8 == 0) {
                feiletKlipping()
            } else if (p2 == 0) {
                steg = 1
                neoPixelKlipping.setPixelColor(0, neopixel.colors(NeoPixelColors.Green))
                neoPixelKlipping.show()
            }
        } else if (steg == 1) {
            if (p1 == 0) {
                feiletKlipping()
            } else if (p8 == 0) {
                steg = 2
                neoPixelKlipping.setPixelColor(1, neopixel.colors(NeoPixelColors.Green))
                neoPixelKlipping.show()
            }
        } else if (steg == 2 && p1 == 0) {
            steg = 3
            neoPixelKlipping.setPixelColor(2, neopixel.colors(NeoPixelColors.Green))
            neoPixelKlipping.show()
            stoppNedtelling("DESARMERT", false)
        }
    }
    basic.pause(50)
})

basic.forever(function () {
    if (nedtelling && !flyttetKoffert && !seierssignalAktivt) {
        let endringPitch = Math.abs(input.rotation(Rotation.Pitch) - startvinkel)
        let endringRoll = Math.abs(input.rotation(Rotation.Roll) - startrull)
        endringRoll = Math.min(endringRoll, 360 - endringRoll)

        if (endringPitch > 10 || endringRoll > 10) {
            flyttetKoffert = true
            music.setVolume(255)
            music.play(music.tonePlayable(262, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
            if (nedtelling && !seierssignalAktivt) {
                music.play(music.createSoundExpression(
                    WaveShape.Noise, 500, 3106, 255, 255, 2000,
                    SoundExpressionEffect.None, InterpolationCurve.Linear
                ), music.PlaybackMode.UntilDone)
            }
        }
    }
    basic.pause(50)
})

basic.forever(function () {
    if (nedtelling) {
        let tidIgjenMs = sluttTid - input.runningTime()
        if (tidIgjenMs <= 0) {
            stoppNedtelling("BOOM!", true)
        } else {
            let sekunderIgjen = Math.idiv(tidIgjenMs + 999, 1000)
            if (sekunderIgjen != sistVistSekund) {
                sistVistSekund = sekunderIgjen
                let minutter = Math.idiv(sekunderIgjen, 60)
                let sekunder = sekunderIgjen % 60
                tekstTilVisning = toSifre(minutter) + ":" + toSifre(sekunder)
            }
        }
    }
    basic.pause(10)
})

control.inBackground(function () {
    while (true) {
        if (nedtelling) {
            if (seierssignaler.length > 0) {
                let oppgave = seierssignaler[0]
                seierssignaler.shift()
                spillSeierssignal()
                if (oppgave == "telefon" && telefonOppgaveLost) {
                    nummer = ""
                }
            } else {
                neoPixelRing.rotate(-1)
                neoPixelRing.show()
            }
        }
        basic.pause(1000 / antallNeoPixels)
    }
})
