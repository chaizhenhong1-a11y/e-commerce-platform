// ignore_for_file: deprecated_member_use, avoid_web_libraries_in_flutter

import 'dart:html' as html;

String? readWebSessionValue(String key) {
  try {
    return html.window.sessionStorage[key];
  } catch (_) {
    return null;
  }
}

void writeWebSessionValue(String key, String value) {
  try {
    html.window.sessionStorage[key] = value;
  } catch (_) {
    // AuthStorage retains its in-memory fallback for restricted browsers.
  }
}

void removeWebSessionValue(String key) {
  try {
    html.window.sessionStorage.remove(key);
  } catch (_) {
    // Nothing else is required; AuthStorage also clears its memory fallback.
  }
}
