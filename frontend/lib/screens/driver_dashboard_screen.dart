import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../services/native_service.dart';
import 'driver_login_screen.dart';

class DriverDashboardScreen extends StatefulWidget {
  const DriverDashboardScreen({super.key});

  @override
  State<DriverDashboardScreen> createState() => _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends State<DriverDashboardScreen> {
  Map<String, dynamic>? _session;
  Map<String, dynamic>? _dispatchData;
  String? _lastEmergencyId;
  bool _isLoading = true;
  bool _isActionLoading = false;
  bool _isCardExpanded = true;
  bool _hasLocationPermission = false;
  bool _isBuzzerActive = false;
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
    _checkAndRequestLocation();
    // Auto-poll mission dispatch every 4 seconds for instant real-time sync with patient requests
    _pollingTimer = Timer.periodic(const Duration(seconds: 4), (_) => _fetchMission(silent: true));
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    NativeService.stopBuzzer();
    super.dispose();
  }

  Future<void> _checkAndRequestLocation() async {
    final granted = await NativeService.checkLocationPermission();
    if (!granted) {
      final req = await NativeService.requestLocationPermission();
      if (mounted) setState(() => _hasLocationPermission = req);
    } else {
      if (mounted) setState(() => _hasLocationPermission = true);
    }
  }

  Future<void> _loadInitialData() async {
    final sess = await ApiService.getSession();
    if (mounted) {
      setState(() {
        _session = sess;
      });
    }
    await _fetchMission();
  }

  Future<void> _fetchMission({bool silent = false}) async {
    if (!silent) {
      setState(() => _isLoading = true);
    }
    final res = await ApiService.getMyDispatch();
    if (mounted) {
      if (res['success'] == true) {
        final activeEmg = res['data']?['active_emergency'];
        final currentId = activeEmg?['id'] as String?;

        // Detect newly assigned emergency: trigger buzzer sound & alert!
        if (currentId != null && currentId != _lastEmergencyId) {
          _triggerEmergencyAlarm(activeEmg);
        }

        setState(() {
          _isLoading = false;
          _dispatchData = res['data'];
          _lastEmergencyId = currentId;
        });
      } else {
        setState(() => _isLoading = false);
      }
    }
  }

  void _triggerEmergencyAlarm(Map<String, dynamic> activeEmg) {
    setState(() {
      _isBuzzerActive = true;
      _isCardExpanded = true; // Auto expand card for immediate response
    });

    // Play loud emergency buzzer sound and vibration
    NativeService.playBuzzer();

    // Show high-priority banner with patient info and mute option
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.emergency, color: Colors.white, size: 30),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '🚨 EMERGENCY INTAKE DISPATCHED!',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Colors.white),
                  ),
                  Text(
                    'Patient: ${activeEmg['patient_name']} • Location: ${activeEmg['pickup_address']}',
                    style: const TextStyle(fontSize: 12, color: Colors.white70),
                  ),
                ],
              ),
            ),
            TextButton(
              style: TextButton.styleFrom(backgroundColor: Colors.white24),
              onPressed: _silenceBuzzer,
              child: const Text('MUTE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        backgroundColor: Colors.red.shade700,
        duration: const Duration(seconds: 10),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }

  void _silenceBuzzer() {
    NativeService.stopBuzzer();
    if (mounted) {
      setState(() => _isBuzzerActive = false);
    }
  }

  void _testBuzzerSound() {
    NativeService.playBuzzer();
    setState(() => _isBuzzerActive = true);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.volume_up, color: Colors.white),
            SizedBox(width: 10),
            Text('🔊 Testing Ambulance Siren Buzzer & Vibration...'),
          ],
        ),
        backgroundColor: Colors.amber.shade800,
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'STOP',
          textColor: Colors.white,
          onPressed: _silenceBuzzer,
        ),
      ),
    );
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) _silenceBuzzer();
    });
  }

  Future<void> _updateStatus(String status) async {
    _silenceBuzzer();
    setState(() {
      _isActionLoading = true;
    });

    final res = await ApiService.updateStatus(status);

    setState(() {
      _isActionLoading = false;
    });

    if (res['success'] == true) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Stage updated: $status'),
            backgroundColor: Colors.green.shade700,
          ),
        );
      }
      await _fetchMission();
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['message'] ?? 'Failed to update status'),
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
    }
  }

  Future<void> _handleLogout() async {
    _silenceBuzzer();
    await ApiService.logout();
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const DriverLoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final ambulance = _dispatchData?['ambulance'];
    final emergency = _dispatchData?['active_emergency'];
    final stage = emergency?['journey_stage'] ?? 'STANDBY';
    final isStage2 = stage == 'PICKUP_CONFIRMED' || stage == 'EN_ROUTE_TO_HOSPITAL' || emergency?['stage2_route'] != null;
    final isCompleted = stage == 'ARRIVED_AT_HOSPITAL' || stage == 'COMPLETED';

    dynamic activeRoute;
    if (emergency != null) {
      if (isStage2) {
        activeRoute = emergency['stage2_route'];
      } else {
        activeRoute = emergency['stage1_route'];
      }
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.red.shade600,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    ambulance?['vehicle_type'] ?? 'ALS',
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  ambulance?['vehicle_number'] ?? _session?['username'] ?? 'Ambulance',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ],
            ),
            Text(
              'Driver: ${_session?['name'] ?? _session?['username'] ?? 'Pilot'}',
              style: const TextStyle(fontSize: 11, color: Colors.blueGrey),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isBuzzerActive ? Icons.volume_off : Icons.notifications_active_outlined,
              color: _isBuzzerActive ? Colors.redAccent : Colors.amberAccent,
            ),
            tooltip: _isBuzzerActive ? 'Stop Buzzer' : 'Test Siren Buzzer',
            onPressed: _isBuzzerActive ? _silenceBuzzer : _testBuzzerSound,
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.blueAccent),
            tooltip: 'Sync Dispatch',
            onPressed: () => _fetchMission(),
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white70),
            tooltip: 'Sign Out',
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.redAccent))
          : RefreshIndicator(
              onRefresh: () => _fetchMission(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Location Permission Banner if not yet granted
                    if (!_hasLocationPermission) ...[
                      _buildLocationPermissionBanner(),
                      const SizedBox(height: 14),
                    ],

                    // Top Mission Status Banner
                    _buildMissionBanner(stage, emergency),
                    const SizedBox(height: 16),

                    if (emergency == null)
                      _buildStandbyCard()
                    else ...[
                      // The Main Request Arrival Card (Click to expand/collapse details)
                      _buildRequestCard(emergency, activeRoute, isStage2),
                      const SizedBox(height: 16),

                      // When Card is Clicked / Expanded: Show Full Route & Details
                      if (_isCardExpanded) ...[
                        if (activeRoute != null) _buildRouteCard(activeRoute, isStage2),
                        const SizedBox(height: 16),

                        if (emergency['hospital_recommendations'] != null &&
                            (emergency['hospital_recommendations'] as List).isNotEmpty)
                          _buildHospitalCard(emergency),
                        const SizedBox(height: 20),
                      ],

                      // Driver Action Buttons
                      _buildDriverActionButtons(stage, isStage2, isCompleted),
                      const SizedBox(height: 24),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildLocationPermissionBanner() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.blue.shade900.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.shade600),
      ),
      child: Row(
        children: [
          const Icon(Icons.location_on, color: Colors.lightBlueAccent, size: 28),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'GPS Location Access Required',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                ),
                Text(
                  'Enable live GPS telemetry for automatic fastest-route dispatch',
                  style: TextStyle(color: Colors.white70, fontSize: 11),
                ),
              ],
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blueAccent,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: _checkAndRequestLocation,
            child: const Text('ALLOW', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
          ),
        ],
      ),
    );
  }

  Widget _buildMissionBanner(String stage, Map<String, dynamic>? emergency) {
    Color bannerColor = Colors.blue.shade900;
    String label = 'AMBULANCE STANDBY';
    IconData icon = Icons.check_circle_outline;

    if (emergency != null) {
      if (stage == 'EN_ROUTE_TO_PATIENT' || stage == 'STAGE_1_DISPATCH_TO_PATIENT') {
        bannerColor = Colors.amber.shade900;
        label = 'EN-ROUTE TO PATIENT SCENE';
        icon = Icons.navigation;
      } else if (stage == 'ARRIVED_AT_SCENE') {
        bannerColor = Colors.orange.shade900;
        label = 'ARRIVED AT SCENE (PATIENT CONTACT)';
        icon = Icons.location_on;
      } else if (stage == 'PICKUP_CONFIRMED' || stage == 'EN_ROUTE_TO_HOSPITAL') {
        bannerColor = Colors.purple.shade900;
        label = 'TRANSFERRING TO HOSPITAL (STAGE 2)';
        icon = Icons.local_hospital;
      } else if (stage == 'ARRIVED_AT_HOSPITAL' || stage == 'COMPLETED') {
        bannerColor = Colors.green.shade900;
        label = 'MISSION COMPLETED / ADMITTED';
        icon = Icons.done_all;
      }
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: bannerColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13),
                ),
                Text(
                  emergency != null ? 'Incident #${emergency['id']}' : 'Ready for emergency intake assignment',
                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                ),
              ],
            ),
          ),
          if (_isBuzzerActive)
            IconButton(
              icon: const Icon(Icons.volume_off, color: Colors.white),
              onPressed: _silenceBuzzer,
              tooltip: 'Silence Buzzer',
            ),
        ],
      ),
    );
  }

  Widget _buildStandbyCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.blueGrey.shade800),
      ),
      child: Column(
        children: [
          const Icon(Icons.radar, size: 56, color: Colors.blueAccent),
          const SizedBox(height: 16),
          const Text(
            'Ambulance Unit On Standby',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Monitoring incoming requests from website and 108 emergency queue. When a patient or bystander requests an ambulance, this terminal will ring a buzzer sound and display the request card here immediately.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.blueGrey, fontSize: 12, height: 1.4),
          ),
          const SizedBox(height: 20),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.amberAccent,
              side: const BorderSide(color: Colors.amberAccent),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: _testBuzzerSound,
            icon: const Icon(Icons.volume_up, size: 18),
            label: const Text('Test Emergency Buzzer Sound', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // The interactive Request Card (matches website dashboard format)
  Widget _buildRequestCard(Map<String, dynamic> emergency, dynamic activeRoute, bool isStage2) {
    final callerPhone = emergency['caller_phone'] ?? '+91-9876543210';
    final category = emergency['category'] ?? emergency['emergency_type'] ?? 'GENERAL';
    final severity = emergency['severity'] ?? 'HIGH';
    final isCritical = severity == 'CRITICAL';
    final eta = activeRoute?['total_duration_minutes'] ?? '2.5';
    final dist = activeRoute?['total_distance_km'] ?? '1.8';

    return GestureDetector(
      onTap: () {
        setState(() {
          _isCardExpanded = !_isCardExpanded;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: isCritical ? Colors.red.shade600 : Colors.blue.shade700,
            width: isCritical ? 2.0 : 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: isCritical ? Colors.red.shade900.withOpacity(0.3) : Colors.black26,
              blurRadius: 15,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Card Header: Badges & Click Indicator
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isCritical ? Colors.red.shade700 : Colors.amber.shade900,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '$severity EMERGENCY',
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade900,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        category,
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                Row(
                  children: [
                    Text(
                      _isCardExpanded ? 'Collapse' : 'Tap for Route',
                      style: const TextStyle(color: Colors.lightBlueAccent, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                    Icon(
                      _isCardExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                      color: Colors.lightBlueAccent,
                      size: 18,
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Patient Name & Bystander Details
            Text(
              emergency['patient_name'] ?? 'Emergency Patient',
              style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.person_pin, size: 14, color: Colors.blueGrey),
                const SizedBox(width: 6),
                Text(
                  'Reported by: ${emergency['caller_name'] ?? 'Bystander Helper'}',
                  style: const TextStyle(color: Colors.blueGrey, fontSize: 12, fontWeight: FontWeight.w500),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Pickup Location Box
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.blueGrey.shade800),
              ),
              child: Row(
                children: [
                  const Icon(Icons.place, color: Colors.redAccent, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'PICKUP DESTINATION',
                          style: TextStyle(color: Colors.grey, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          emergency['pickup_address'] ?? 'Scene Coordinates Location',
                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Telemetry Metric Chips (ETA & Distance)
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.blue.shade800),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.timer, color: Colors.lightBlueAccent, size: 16),
                        const SizedBox(width: 6),
                        Text('ETA: $eta mins', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.blue.shade800),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.straighten, color: Colors.lightBlueAccent, size: 16),
                        const SizedBox(width: 6),
                        Text('Dist: $dist km', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Contact Caller Button
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.phone_in_talk, color: Colors.greenAccent, size: 18),
                      const SizedBox(width: 10),
                      Text(
                        callerPhone,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13),
                      ),
                    ],
                  ),
                  const Text(
                    'Caller Contact',
                    style: TextStyle(color: Colors.greenAccent, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRouteCard(Map<String, dynamic> route, bool isStage2) {
    final dist = route['total_distance_km'] ?? '--';
    final dur = route['total_duration_minutes'] ?? '--';
    final path = (route['path_nodes'] as List?)?.join(' ➔ ') ?? '';
    final isRerouted = route['is_rerouted'] == true;
    final algorithm = route['algorithm'] ?? 'Bidirectional A*-DEC';

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.blueGrey.shade800),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                isStage2 ? 'STAGE 2: SCENE ➔ DESTINATION HOSPITAL' : 'STAGE 1: STATION ➔ PATIENT SCENE',
                style: const TextStyle(color: Colors.lightBlueAccent, fontSize: 11, fontWeight: FontWeight.w900),
              ),
              if (isRerouted)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: Colors.amber.shade900, borderRadius: BorderRadius.circular(6)),
                  child: const Text('DETOUR ACTIVE', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Algorithm: $algorithm',
            style: const TextStyle(color: Colors.blueGrey, fontSize: 10),
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: const Color(0xFF0F172A), borderRadius: BorderRadius.circular(12)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('ESTIMATED TIME', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Text('$dur min', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: const Color(0xFF0F172A), borderRadius: BorderRadius.circular(12)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('TRANSIT DISTANCE', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Text('$dist km', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Path Waypoints
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                const Icon(Icons.alt_route, color: Colors.blueAccent, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    path.isNotEmpty ? path : 'Direct optimal road corridor',
                    style: const TextStyle(color: Colors.white70, fontSize: 11, fontFamily: 'monospace'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHospitalCard(Map<String, dynamic> emergency) {
    final recs = emergency['hospital_recommendations'] as List;
    final top = recs.first['hospital'];
    final score = recs.first['composite_score'];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.green.shade800),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'DESTINATION HOSPITAL ASSIGNED',
                style: TextStyle(color: Colors.lightGreenAccent, fontSize: 11, fontWeight: FontWeight.w900),
              ),
              Text(
                'Match Score: $score',
                style: const TextStyle(color: Colors.greenAccent, fontSize: 11, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 8),

          Text(
            top['name'] ?? 'City Trauma Hospital',
            style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w900),
          ),
          Text(
            top['address'] ?? 'Emergency Department Entrance',
            style: const TextStyle(color: Colors.grey, fontSize: 11),
          ),
          const SizedBox(height: 10),

          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: Colors.green.shade900, borderRadius: BorderRadius.circular(8)),
                child: Text(
                  '${top['available_icu_beds']} ICU Beds Open',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: Colors.blue.shade900, borderRadius: BorderRadius.circular(8)),
                child: Text(
                  '${top['available_er_beds']} ER Beds Open',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDriverActionButtons(String stage, bool isStage2, bool isCompleted) {
    if (isCompleted) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.green.shade900, borderRadius: BorderRadius.circular(16)),
        child: const Center(
          child: Text(
            '✓ Mission Completed & Patient Admitted',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15),
          ),
        ),
      );
    }

    if (!isStage2) {
      return Column(
        children: [
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF334155),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              onPressed: _isActionLoading ? null : () => _updateStatus('ARRIVED_AT_SCENE'),
              icon: const Icon(Icons.location_on),
              label: const Text('1. Arrived at Scene (Locate Patient)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green.shade600,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 4,
              ),
              onPressed: _isActionLoading ? null : () => _updateStatus('PICKUP_CONFIRMED'),
              icon: const Icon(Icons.local_hospital),
              label: const Text('2. Confirm Pickup ➔ Route to Hospital', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
            ),
          ),
        ],
      );
    }

    // Stage 2: In transit to hospital
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.blue.shade600,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 6,
        ),
        onPressed: _isActionLoading ? null : () => _updateStatus('ARRIVED_AT_HOSPITAL'),
        icon: const Icon(Icons.check_circle),
        label: const Text('Arrived at Hospital & Complete Handover', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
      ),
    );
  }
}
