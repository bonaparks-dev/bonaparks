package com.bonaparks.tvhome;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Au demarrage de la TV : ouvrir directement l'accueil Bonaparks. */
public class Boot extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent i) {
        Intent h = new Intent(c, Home.class);
        h.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        c.startActivity(h);
    }
}
