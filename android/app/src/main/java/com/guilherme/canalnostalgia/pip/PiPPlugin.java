package com.guilherme.canalnostalgia.pip;

import android.app.PictureInPictureParams;
import android.content.res.Configuration;
import android.os.Build;
import android.util.Rational;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PiP")
public class PiPPlugin extends Plugin {

    private static final String EVENT_PIP_MODE_CHANGED = "pipModeChanged";

    @PluginMethod
    public void enterPiP(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                Rational aspectRatio = new Rational(16, 9);
                PictureInPictureParams.Builder pipBuilder = new PictureInPictureParams.Builder();
                pipBuilder.setAspectRatio(aspectRatio);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    pipBuilder.setAutoEnterEnabled(true);
                    pipBuilder.setSeamlessResizeEnabled(true);
                }

                getActivity().enterPictureInPictureMode(pipBuilder.build());
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to enter Picture-in-Picture mode", e);
            }
        } else {
            call.reject("Picture-in-Picture not supported on this Android version.");
        }
    }

    @PluginMethod
    public void isPipSupported(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ret.put("isSupported", getActivity().getPackageManager().hasSystemFeature(android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE));
        } else {
            ret.put("isSupported", false);
        }
        call.resolve(ret);
    }

    // New public method to emit PiP mode changed event
    public void emitPipModeChanged(boolean isInPipMode) {
        JSObject ret = new JSObject();
        ret.put("isInPipMode", isInPipMode);
        notifyListeners(EVENT_PIP_MODE_CHANGED, ret);
    }
}
