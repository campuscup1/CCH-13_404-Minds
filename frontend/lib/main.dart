import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'screens/driver_login_screen.dart';
import 'screens/driver_dashboard_screen.dart';
import 'services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  // Check if driver has an existing session
  final session = await ApiService.getSession();
  runApp(MediRouteDriverApp(hasSession: session != null));
}

class MediRouteDriverApp extends StatelessWidget {
  final bool hasSession;
  const MediRouteDriverApp({super.key, required this.hasSession});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MediRoute Driver',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.red.shade600,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        fontFamily: 'sans-serif',
      ),
      home: hasSession ? const DriverDashboardScreen() : const DriverLoginScreen(),
    );
  }
}
