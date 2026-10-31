import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'driver_dashboard_screen.dart';

class DriverLoginScreen extends StatefulWidget {
  const DriverLoginScreen({super.key});

  @override
  State<DriverLoginScreen> createState() => _DriverLoginScreenState();
}

class _DriverLoginScreenState extends State<DriverLoginScreen> {
  final _usernameController = TextEditingController(text: 'driver1');
  final _passwordController = TextEditingController(text: 'driver123');
  final _ipController = TextEditingController();

  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadCurrentServer();
  }

  Future<void> _loadCurrentServer() async {
    await ApiService.loadBaseUrl();
    setState(() {
      _ipController.text = ApiService.baseUrl;
    });
  }

  Future<void> _handleLogin(String username, String password) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await ApiService.login(username, password);

    setState(() {
      _isLoading = false;
    });

    if (res['success'] == true) {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DriverDashboardScreen()),
        );
      }
    } else {
      setState(() {
        _errorMessage = res['message'] ?? 'Login failed. Check server IP and Wi-Fi.';
      });
    }
  }

  void _showServerSettingsModal() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.wifi, color: Colors.blue),
            SizedBox(width: 8),
            Text('Server Wi-Fi Address', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter the backend URL running on your PC (same Wi-Fi):',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _ipController,
              decoration: InputDecoration(
                hintText: 'http://172.20.67.74:8000/api',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.link),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF102A43),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () async {
              final newUrl = _ipController.text.trim();
              await ApiService.setBaseUrl(newUrl);
              if (ctx.mounted) Navigator.pop(ctx);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Server set to: ${ApiService.baseUrl}')),
                );
              }
            },
            child: const Text('Save IP', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Ambulance Badge Icon
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: Colors.red.shade600,
                    borderRadius: BorderRadius.circular(26),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.red.shade600.withOpacity(0.4),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.emergency,
                    color: Colors.white,
                    size: 52,
                  ),
                ),
                const SizedBox(height: 20),

                // App Titles
                const Text(
                  'MediRoute Driver',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Emergency Ambulance Crew Mission Terminal',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.blueGrey,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 32),

                // Error Message if any
                if (_errorMessage != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 20),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade900.withOpacity(0.4),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.red.shade500),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: Colors.redAccent, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(color: Colors.white, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),

                // 1-Click Fast Driver Demo Login Card
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: Colors.blue.shade900),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            '1-TAP DRIVER DEMO LOGIN',
                            style: TextStyle(
                              color: Colors.blueAccent,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.0,
                            ),
                          ),
                          GestureDetector(
                            onTap: _showServerSettingsModal,
                            child: const Row(
                              children: [
                                Icon(Icons.wifi, size: 14, color: Colors.lightGreenAccent),
                                SizedBox(width: 4),
                                Text(
                                  'LAN IP',
                                  style: TextStyle(color: Colors.lightGreenAccent, fontSize: 11, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red.shade600,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              ),
                              onPressed: _isLoading ? null : () => _handleLogin('driver1', 'driver123'),
                              child: const Column(
                                children: [
                                  Text('Driver 1 (ALS)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  Text('Vehicle: EMERG-01', style: TextStyle(fontSize: 10, color: Colors.white70)),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF334155),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              ),
                              onPressed: _isLoading ? null : () => _handleLogin('driver3', 'driver123'),
                              child: const Column(
                                children: [
                                  Text('Driver 3 (ALS)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  Text('Vehicle: EMERG-03', style: TextStyle(fontSize: 10, color: Colors.white70)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Manual Credentials Form
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Column(
                    children: [
                      TextField(
                        controller: _usernameController,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          labelText: 'Driver Username',
                          labelStyle: const TextStyle(color: Colors.grey, fontSize: 13),
                          prefixIcon: const Icon(Icons.person, color: Colors.blueGrey),
                          filled: true,
                          fillColor: const Color(0xFF0F172A),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                        ),
                      ),
                      const SizedBox(height: 14),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          labelText: 'Password',
                          labelStyle: const TextStyle(color: Colors.grey, fontSize: 13),
                          prefixIcon: const Icon(Icons.lock, color: Colors.blueGrey),
                          filled: true,
                          fillColor: const Color(0xFF0F172A),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                        ),
                      ),
                      const SizedBox(height: 18),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue.shade600,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          onPressed: _isLoading
                              ? null
                              : () => _handleLogin(_usernameController.text.trim(), _passwordController.text.trim()),
                          child: _isLoading
                              ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text('Sign In to Mission Console', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Server Status Indicator
                GestureDetector(
                  onTap: _showServerSettingsModal,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.settings, size: 14, color: Colors.grey),
                      const SizedBox(width: 6),
                      Text(
                        'Target Server: ${ApiService.baseUrl}',
                        style: const TextStyle(color: Colors.grey, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
