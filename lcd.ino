#include <Arduino.h>
#include <LiquidCrystal.h>

// initialize the library with the numbers of the interface pins
LiquidCrystal lcd(7, 8, 9, 10, 11, 12);

String inputString = "";     // a String to hold incoming data
bool stringComplete = false; // whether the string is complete

void setup()
{
    // set up the LCD's number of columns and rows:
    lcd.begin(16, 2);
    // Print a message to the LCD.
    lcd.print("Open SerialPort!");

    Serial.begin(9600);
    inputString.reserve(200);
}

void loop()
{
    // set the cursor to column 0, line 1
    lcd.setCursor(0, 1);
    // (note: line 1 is the second row, since counting begins with 0):

    if (stringComplete)
    {
        lcd.clear();
        lcd.print(inputString);
        stringComplete = false;
        inputString = "";
    }
}

void serialEvent()
{
    while (Serial.available())
    {
        // get the new byte:
        char inChar = (char)Serial.read();
        // add it to the inputString:
        // if the incoming character is a newline, set a flag so the main loop can
        // do something about it:
        Serial.write(inChar);
        if (inChar == '\n')
        {
            stringComplete = true;
        }
        else
        {
            inputString += inChar;
        }
    }
}
