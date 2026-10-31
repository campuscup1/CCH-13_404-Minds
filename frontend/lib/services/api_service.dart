import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Default LAN IP of the backend server.
  // Can be adjusted from the app login screen settings if IP changes!
  static String baseUrl = 'http://172.20.67.74:8000/api';

  static Future<void> setBaseUrl(String newUrl) async {
    baseUrl = newUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_base_url', newUrl);
  }

  static Future<void> loadBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('api_base_url');
    if (saved != null && saved.isNotEmpty) {
      baseUrl = saved;
    }
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('driver_access_token');
  }

  static Future<void> saveSession(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    if (data['access_token'] != null) {
      await prefs.setString('driver_access_token', data['access_token']);
    }
    await prefs.setString('driver_user_data', jsonEncode(data));
  }

  static Future<Map<String, dynamic>?> getSession() async {
    final prefs = await SharedPreferences.getInstance();
    final str = prefs.getString('driver_user_data');
    if (str != null) {
      try {
        return jsonDecode(str);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('driver_access_token');
    await prefs.remove('driver_user_data');
  }

  // 1. Driver Login
  static Future<Map<String, dynamic>> login(String username, String password) async {
    await loadBaseUrl();
    final url = Uri.parse('$baseUrl/auth/login');
    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password}),
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await saveSession(data);
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'message': 'Invalid driver credentials (${response.statusCode})'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // 2. Fetch Driver Active Mission / Dispatch
  static Future<Map<String, dynamic>> getMyDispatch() async {
    await loadBaseUrl();
    final token = await getToken();
    final url = Uri.parse('$baseUrl/driver/my-dispatch');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'message': 'HTTP ${response.statusCode}: ${response.body}'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Could not connect to dispatch server: $e'};
    }
  }

  // 3. Update Driver Status (EN_ROUTE_TO_PATIENT, ARRIVED_AT_SCENE, PICKUP_CONFIRMED, ARRIVED_AT_HOSPITAL)
  static Future<Map<String, dynamic>> updateStatus(String status, {String? note}) async {
    await loadBaseUrl();
    final token = await getToken();
    final url = Uri.parse('$baseUrl/driver/status');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'status': status,
          'note': note ?? 'Updated from Driver Mobile App',
        }),
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'message': 'HTTP ${response.statusCode}: ${response.body}'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Failed to update status: $e'};
    }
  }

  // 4. Update Driver GPS Location
  static Future<Map<String, dynamic>> updateLocation(double lat, double lon, {double? speedKmh}) async {
    await loadBaseUrl();
    final token = await getToken();
    final url = Uri.parse('$baseUrl/driver/location');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'current_coordinate': {'lat': lat, 'lon': lon},
          'speed_kmh': speedKmh ?? 45.0,
        }),
      ).timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'message': 'Status ${response.statusCode}'};
      }
    } catch (e) {
      return {'success': false, 'message': '$e'};
    }
  }

  // 5. Fetch Public Map Data (Hospitals, Nodes)
  static Future<Map<String, dynamic>> getMapData() async {
    await loadBaseUrl();
    final url = Uri.parse('$baseUrl/public/map-data');
    try {
      final response = await http.get(url).timeout(const Duration(seconds: 8));
      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      }
      return {'success': false, 'message': 'Failed with code ${response.statusCode}'};
    } catch (e) {
      return {'success': false, 'message': '$e'};
    }
  }
}
