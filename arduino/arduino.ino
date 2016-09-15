#include<Bridge.h>
#include <YunClient.h>

byte mac[] = { 0x00, 0xAA, 0xBB, 0xCC, 0xDE, 0x01 }; // RESERVED MAC ADDRESS
YunClient client;
long randNumber;
int FSRReading;
float poids;
float total;
int trig = A4; 
int echo = A3; 
float lecture_echo; 
float cm;
float niveau_remp;

void setup()
{ 
  
   pinMode(trig, OUTPUT); 
   digitalWrite(trig, LOW);
   pinMode(echo, INPUT);
   Bridge.begin(); 
   Serial.begin(9600);
}

void loop()
{
  /* Traitement Distance */
  digitalWrite(trig, HIGH); 
  delayMicroseconds(10); 
  digitalWrite(trig, LOW); 
  lecture_echo = pulseIn(echo, HIGH); 
  cm = lecture_echo / 58; 
  Serial.println(cm);

  
  /* Traitement capteur distance et envoi de l'impulsion ultrasons */
 //TRANSFORM RESIST TO WEIGHT

 
/*  FSRReading = analogRead(FSR_Pin);
  Serial.println(FSRReading);
  Serial.println("cm : ");
 // niveau_remp=(100-cm);
  Serial.println(cm);

  */
  
  if (client.connect("nodejs-laposteiot.rhcloud.com", 80)) 
  {
    Serial.println("connected");
    client.println("GET /api/wslaposte/100001/100/"+String(cm)+" HTTP/1.1");
    client.println("Host: nodejs-laposteiot.rhcloud.com");
    client.println("Connection: close");
    client.println();
  } 
  else 
  {
    Serial.println("connection failed");
  }
  delay(150); // WAIT FIVE MINUTES BEFORE SENDING AGAIN
 
 if (client.connected())
  
  { 
    client.stop();  // DISCONNECT FROM THE SERVER
  }

  
}




