package com.bonaparks.tvhome;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.os.Handler;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/** Ecran d'accueil Bonaparks pour TV : 5 applis + parametres, fond plan de maison. */
public class Home extends Activity {

    static final int BG = 0xFF080C17, BLUE = 0xFF5289FF, TEXT = 0xFFF1F4FF, MUTED = 0xFFA0ABC0;

    static final String[][] APPS = {
            {"TV", "com.tcl.tv", "Chaînes TV"},
            {"Netflix", "com.netflix.ninja", "Films & séries"},
            {"YouTube", "com.google.android.youtube.tv", "Vidéos"},
            {"Disney+", "com.disney.disneyplus", "Disney, Marvel, Pixar"},
            {"Molotov", "tv.molotov.app", "TV en direct"},
            {"Play Store", "com.android.vending", "Installer des applis"},
            {"Réglages", "#settings", "Paramètres de la TV"},
    };

    private final Handler handler = new Handler();
    private TextView clock, date, greeting, net, hint;
    private float s; // echelle : 1.0 = ecran 1280 px de large

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        s = getResources().getDisplayMetrics().widthPixels / 1280f;

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(BG);
        root.addView(new Backdrop(this), match());

        // ---- en-tete
        LinearLayout brand = new LinearLayout(this);
        brand.setOrientation(LinearLayout.HORIZONTAL);
        brand.setGravity(Gravity.CENTER_VERTICAL);
        brand.addView(new Logo(this), new LinearLayout.LayoutParams(px(46), px(46)));
        LinearLayout names = new LinearLayout(this);
        names.setOrientation(LinearLayout.VERTICAL);
        names.setPadding(px(14), 0, 0, 0);
        TextView title = text("Bonaparks", 26, TEXT, true);
        title.setLetterSpacing(-0.03f);
        names.addView(title);
        names.addView(text("TV", 11, 0xFF8EAFFF, false));
        brand.addView(names);
        root.addView(brand, at(Gravity.TOP | Gravity.START, 64, 48));

        LinearLayout right = new LinearLayout(this);
        right.setOrientation(LinearLayout.VERTICAL);
        right.setGravity(Gravity.END);
        clock = text("--:--", 52, TEXT, false);
        clock.setTypeface(Typeface.create("sans-serif-light", Typeface.NORMAL));
        clock.setLetterSpacing(-0.02f);
        date = text("", 14, MUTED, false);
        net = text("", 11, 0xFF92B5EF, false);
        net.setLetterSpacing(0.15f);
        net.setPadding(0, px(8), 0, 0);
        right.addView(clock);
        right.addView(date);
        right.addView(net);
        root.addView(right, at(Gravity.TOP | Gravity.END, 64, 34));

        // ---- titre central
        LinearLayout mid = new LinearLayout(this);
        mid.setOrientation(LinearLayout.VERTICAL);
        TextView eyebrow = text("●  BONAPARKS  ·  ESPACE TV", 11, 0xFF92B5EF, true);
        eyebrow.setLetterSpacing(0.2f);
        greeting = text("Bonsoir", 54, TEXT, true);
        greeting.setLetterSpacing(-0.04f);
        greeting.setPadding(0, px(10), 0, px(6));
        hint = text("Choisis une appli avec la télécommande.", 15, MUTED, false);
        mid.addView(eyebrow);
        mid.addView(greeting);
        mid.addView(hint);
        root.addView(mid, at(Gravity.TOP | Gravity.START, 64, 205));

        // ---- rangee d'applis
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setClipChildren(false);
        row.setClipToPadding(false);
        View first = null;
        for (String[] app : APPS) {
            View t = tile(app);
            if (t == null) continue;
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(px(app[1].startsWith("#") ? 104 : 152), px(122));
            lp.setMargins(0, 0, px(22), 0);
            row.addView(t, lp);
            if (first == null) first = t;
        }
        FrameLayout.LayoutParams rlp = at(Gravity.BOTTOM | Gravity.START, 64, 0);
        rlp.bottomMargin = px(70);
        root.setClipChildren(false);
        root.addView(row, rlp);

        TextView foot = text("Bonaparks  ·  la maison sur ta TV", 10, 0xFF6C809E, false);
        foot.setLetterSpacing(0.12f);
        FrameLayout.LayoutParams flp = at(Gravity.BOTTOM | Gravity.START, 64, 0);
        flp.bottomMargin = px(30);
        root.addView(foot, flp);

        setContentView(root);
        // au reveil de la TV (veille rapide) : revenir directement sur cet accueil
        getApplicationContext().registerReceiver(new android.content.BroadcastReceiver() {
            @Override public void onReceive(Context ctx, Intent i) {
                Intent h = new Intent(ctx, Home.class);
                h.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                ctx.startActivity(h);
            }
        }, new android.content.IntentFilter(Intent.ACTION_SCREEN_ON));
        if (first != null) first.requestFocus();
    }

    private View tile(final String[] app) {
        final String pkg = app[1];
        final boolean settings = pkg.startsWith("#");
        final Intent launch = settings ? new Intent(android.provider.Settings.ACTION_SETTINGS) : launchIntent(pkg);
        if (launch == null) return null;

        final LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setFocusable(true);
        box.setClipChildren(false);

        final FrameLayout card = new FrameLayout(this);
        final GradientDrawable shape = new GradientDrawable();
        shape.setCornerRadius(px(14));
        
        shape.setStroke(px(1), 0x33748FC9);
        card.setBackgroundColor(0xFF101725);
        card.setForeground(shape);
        shape.setColor(0x00000000);
        card.setOutlineProvider(new android.view.ViewOutlineProvider() { @Override public void getOutline(View v, android.graphics.Outline o) { o.setRoundRect(0, 0, v.getWidth(), v.getHeight(), px(14)); } });
        card.setClipToOutline(true);
        card.setElevation(px(4));

        int h = 86;
        if (settings) {
            card.addView(new Gear(this), new FrameLayout.LayoutParams(px(104), px(h)));
        } else {
            Drawable banner = null;
            PackageManager pm = getPackageManager();
            try { banner = pm.getApplicationBanner(pkg); } catch (Exception ignored) { }
            if (banner == null) try { banner = pm.getApplicationLogo(pkg); } catch (Exception ignored) { }
            ImageView iv = new ImageView(this);
            if (banner != null) {
                iv.setImageDrawable(banner);
                iv.setScaleType(ImageView.ScaleType.CENTER_CROP);
            } else {
                try { iv.setImageDrawable(pm.getApplicationIcon(pkg)); } catch (Exception ignored) { }
                iv.setScaleType(ImageView.ScaleType.FIT_CENTER);
                iv.setPadding(px(30), px(18), px(30), px(18));
            }
            card.addView(iv, match());
        }
        box.addView(card, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, px(h)));

        final TextView label = text(app[0], 13, MUTED, true);
        label.setPadding(px(4), px(10), 0, 0);
        box.addView(label);

        box.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override public void onFocusChange(View v, boolean f) {
                float k = f ? 1.09f : 1f;
                card.setPivotX(card.getWidth() / 2f);
                card.setPivotY(card.getHeight());
                card.animate().scaleX(k).scaleY(k).translationY(f ? -px(4) : 0).setDuration(140).start();
                card.setElevation(px(f ? 18 : 4));
                shape.setStroke(px(f ? 4 : 1), f ? 0xFFEAF2FF : 0x33748FC9);
                label.setTextColor(f ? TEXT : MUTED);
                label.animate().translationY(f ? px(6) : 0).setDuration(140).start();
                if (f) hint.setText(app[2]);
            }
        });
        box.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                try { startActivity(launch); }
                catch (ActivityNotFoundException e) { Toast.makeText(Home.this, app[0] + " introuvable", Toast.LENGTH_SHORT).show(); }
            }
        });
        return box;
    }

    private Intent launchIntent(String pkg) {
        PackageManager pm = getPackageManager();
        Intent i = pm.getLeanbackLaunchIntentForPackage(pkg);
        if (i == null) i = pm.getLaunchIntentForPackage(pkg);
        if (i != null) i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        return i;
    }

    private final Runnable tick = new Runnable() {
        @Override public void run() {
            Date d = new Date();
            clock.setText(new SimpleDateFormat("HH:mm", Locale.FRANCE).format(d));
            String ds = new SimpleDateFormat("EEEE d MMMM", Locale.FRANCE).format(d);
            date.setText(ds.substring(0, 1).toUpperCase(Locale.FRANCE) + ds.substring(1));
            int hr = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
            greeting.setText(hr >= 5 && hr < 18 ? "Bonjour" : "Bonsoir");
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            NetworkInfo ni = cm == null ? null : cm.getActiveNetworkInfo();
            net.setText(ni != null && ni.isConnected() ? "●  EN LIGNE" : "○  HORS LIGNE");
            net.setTextColor(ni != null && ni.isConnected() ? 0xFF7FD3A0 : 0xFFE08A7A);
            handler.postDelayed(this, 15000);
        }
    };

    @Override protected void onResume() { super.onResume(); handler.removeCallbacks(tick); tick.run(); }
    @Override protected void onPause() { super.onPause(); handler.removeCallbacks(tick); }
    @Override public void onBackPressed() { /* ecran d'accueil : rien a fermer */ }
    @Override public boolean onKeyDown(int code, KeyEvent e) {
        if (code == KeyEvent.KEYCODE_HOME) return true;
        return super.onKeyDown(code, e);
    }

    // ---------- helpers
    int px(float v) { return Math.round(v * s); }

    TextView text(String t, float size, int color, boolean bold) {
        TextView tv = new TextView(this);
        tv.setText(t);
        tv.setTextColor(color);
        tv.setTextSize(android.util.TypedValue.COMPLEX_UNIT_PX, size * s);
        tv.setTypeface(Typeface.create(bold ? "sans-serif-medium" : "sans-serif", Typeface.NORMAL));
        tv.setIncludeFontPadding(false);
        return tv;
    }

    static FrameLayout.LayoutParams match() { return new FrameLayout.LayoutParams(-1, -1); }

    FrameLayout.LayoutParams at(int gravity, int side, int top) {
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(-2, -2, gravity);
        lp.leftMargin = px(side); lp.rightMargin = px(side); lp.topMargin = px(top);
        return lp;
    }

    /** Fond : plan de maison Bonaparks assombri + grille technique. */
    class Backdrop extends View {
        Bitmap plan;
        final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
        Backdrop(Context c) {
            super(c);
            try (InputStream in = c.getAssets().open("plan.jpg")) { plan = BitmapFactory.decodeStream(in); } catch (Exception ignored) { }
        }
        @Override protected void onDraw(Canvas c) {
            int w = getWidth(), h = getHeight();
            c.drawColor(BG);
            if (plan != null) {
                // plan cale a droite, legerement agrandi, en teinte nuit
                float k = Math.max(w * 0.78f / plan.getWidth(), h * 1.05f / plan.getHeight());
                float pw = plan.getWidth() * k, ph = plan.getHeight() * k;
                RectF dst = new RectF(w - pw + w * 0.06f, (h - ph) / 2f, w + w * 0.06f, (h + ph) / 2f);
                p.setAlpha(255);
                p.setColorFilter(new android.graphics.ColorMatrixColorFilter(new float[]{
                        0.18f, 0.22f, 0.05f, 0, 4,
                        0.22f, 0.30f, 0.08f, 0, 10,
                        0.35f, 0.45f, 0.20f, 0, 30,
                        0, 0, 0, 1, 0}));
                c.drawBitmap(plan, new Rect(0, 0, plan.getWidth(), plan.getHeight()), dst, p);
                p.setColorFilter(null);
            }
            // fondu gauche -> droite pour la lisibilite
            p.setShader(new LinearGradient(0, 0, w, 0,
                    new int[]{0xFF080C17, 0xF2080C17, 0x8C080C17, 0x55080C17},
                    new float[]{0f, 0.32f, 0.62f, 1f}, Shader.TileMode.CLAMP));
            c.drawRect(0, 0, w, h, p);
            p.setShader(new LinearGradient(0, h * 0.55f, 0, h,
                    0x00080C17, 0xF0080C17, Shader.TileMode.CLAMP));
            c.drawRect(0, 0, w, h, p);
            // halo bleu
            p.setShader(new RadialGradient(w * 0.74f, h * 0.1f, w * 0.5f, 0x33183B76, 0x00183B76, Shader.TileMode.CLAMP));
            c.drawRect(0, 0, w, h, p);
            p.setShader(null);
            // grille blueprint
            p.setStrokeWidth(1);
            float g = 40 * s;
            for (float x = 0; x < w; x += g) { p.setColor((Math.round(x / g) % 4 == 0) ? 0x14A0C9FF : 0x08A0C9FF); c.drawLine(x, 0, x, h, p); }
            for (float y = 0; y < h; y += g) { p.setColor((Math.round(y / g) % 4 == 0) ? 0x14A0C9FF : 0x08A0C9FF); c.drawLine(0, y, w, y, p); }
            // reperes techniques
            p.setColor(0x5583B0FF);
            p.setTextSize(9 * s);
            p.setLetterSpacing(0.2f);
            c.drawText("SU PRANU  ·  PLAN RDC  ·  1:100", w - 300 * s, h - 32 * s, p);
            p.setStrokeWidth(1.5f * s);
            float cx = w - 64 * s, cy = 150 * s, r = 9 * s;
            c.drawLine(cx - r, cy, cx + r, cy, p);
            c.drawLine(cx, cy - r, cx, cy + r, p);
            p.setLetterSpacing(0);
        }
    }

    /** Logo Bonaparks (aileron sur la mer). */
    static class Logo extends View {
        final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        Logo(Context c) { super(c); }
        @Override protected void onDraw(Canvas c) {
            float k = getWidth() / 1024f;
            c.save();
            c.scale(k, k);
            Path clip = new Path();
            clip.addRoundRect(new RectF(0, 0, 1024, 1024), 230, 230, Path.Direction.CW);
            c.clipPath(clip);
            p.setShader(new LinearGradient(0, 0, 0, 1024, 0xFF1D3A57, 0xFF0B1823, Shader.TileMode.CLAMP));
            c.drawRect(0, 0, 1024, 1024, p);
            Path fin = new Path();
            fin.moveTo(740, 642); fin.cubicTo(720, 470, 600, 290, 400, 196);
            fin.cubicTo(470, 300, 486, 470, 400, 642); fin.close();
            p.setShader(new LinearGradient(400, 196, 740, 642, 0xFFEEF7FF, 0xFF8FB8DC, Shader.TileMode.CLAMP));
            c.drawPath(fin, p);
            Path sea = new Path();
            sea.moveTo(0, 640); sea.cubicTo(120, 610, 220, 670, 340, 640); sea.cubicTo(460, 610, 560, 670, 680, 640);
            sea.cubicTo(800, 610, 900, 670, 1024, 640); sea.lineTo(1024, 1024); sea.lineTo(0, 1024); sea.close();
            p.setShader(new LinearGradient(0, 640, 0, 1024, 0xFF2A5677, 0xFF0E2131, Shader.TileMode.CLAMP));
            c.drawPath(sea, p);
            p.setShader(null);
            p.setStyle(Paint.Style.STROKE);
            p.setStrokeWidth(28);
            p.setStrokeCap(Paint.Cap.ROUND);
            p.setColor(0xCCC7E4FF);
            Path wave = new Path();
            wave.moveTo(0, 640); wave.cubicTo(120, 610, 220, 670, 340, 640); wave.cubicTo(460, 610, 560, 670, 680, 640);
            wave.cubicTo(800, 610, 900, 670, 1024, 640);
            c.drawPath(wave, p);
            p.setStyle(Paint.Style.FILL);
            c.restore();
        }
    }

    /** Icone reglages dessinee (roue dentee). */
    class Gear extends View {
        final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        Gear(Context c) { super(c); }
        @Override protected void onDraw(Canvas c) {
            float cx = getWidth() / 2f, cy = getHeight() / 2f, r = Math.min(cx, cy) * 0.42f;
            p.setColor(0xFFB6CFF6);
            p.setStyle(Paint.Style.STROKE);
            p.setStrokeWidth(r * 0.34f);
            p.setStrokeCap(Paint.Cap.ROUND);
            p.setStrokeCap(Paint.Cap.BUTT);
            for (int i = 0; i < 8; i++) {
                double a = Math.PI * 2 * i / 8 + Math.PI / 8;
                c.drawLine(cx + (float) Math.cos(a) * r * 0.9f, cy + (float) Math.sin(a) * r * 0.9f,
                        cx + (float) Math.cos(a) * r * 1.18f, cy + (float) Math.sin(a) * r * 1.18f, p);
            }
            c.drawCircle(cx, cy, r * 0.82f, p);
            c.drawCircle(cx, cy, r * 0.32f, p);
        }
    }
}
