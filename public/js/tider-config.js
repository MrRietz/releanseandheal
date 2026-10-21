// Inställningar för tidsbokningen. Lämna båda tomma så visas ingen kalender
// och bokningsformuläret fungerar precis som vanligt.
//
// csvUrl:         Adressen till fliken "Tider" publicerad som CSV
//                 (Arkiv > Dela > Publicera på webben > fliken Tider > CSV).
// reserveApiUrl:  Adressen till webbappen i Apps Script (slutar på /exec).
//
// Prova först utan att fylla i något: lägg ?tider=demo sist i adressen till bokningssidan.
window.TIDER_CONFIG = { csvUrl: "", reserveApiUrl: "" };
