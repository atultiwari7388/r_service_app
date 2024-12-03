import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/widgets/custom_button.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen>
    with SingleTickerProviderStateMixin {
  String? selectedVehicle;
  String? selectedService;
  final TextEditingController milesController = TextEditingController();
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  final List<String> vehicles = ['CH001', 'CH002', 'CH003'];
  final List<String> services = [
    'Oil Change',
    'Tire Rotation',
    'Brake Service'
  ];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Records',
          style: TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ).animate().fadeIn(duration: 600.ms).slideX(begin: -0.2, end: 0),
        elevation: 0,
        backgroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Padding(
          padding: EdgeInsets.all(16.0.w),
          child: Column(
            children: [
              //button section
              Row(
                children: [
                  Expanded(
                    child: CustomButton(
                        text: "Add Records", onPress: () {}, color: kPrimary),
                  ),
                  Expanded(
                    child: CustomButton(
                        text: "Add Miles", onPress: () {}, color: kSecondary),
                  ),
                ],
              ),

              SizedBox(height: 10.h),

              // Filter Section
              Container(
                padding: EdgeInsets.all(16.0.w),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: kPrimary.withOpacity(0.1),
                      spreadRadius: 2,
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Filters',
                      style: TextStyle(
                        fontSize: 20.sp,
                        fontWeight: FontWeight.bold,
                        color: kPrimary,
                      ),
                    )
                        .animate()
                        .fadeIn(duration: 400.ms)
                        .slideX(begin: -0.2, end: 0),
                    SizedBox(height: 20.h),
                    // Vehicle Dropdown
                    ScaleTransition(
                      scale: _scaleAnimation,
                      child: DropdownButtonFormField<String>(
                        decoration: InputDecoration(
                          labelText: 'Select Vehicle',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                BorderSide(color: kPrimary.withOpacity(0.5)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                BorderSide(color: kPrimary.withOpacity(0.5)),
                          ),
                          filled: true,
                          fillColor: Colors.white,
                        ),
                        value: selectedVehicle,
                        items: vehicles.map((String vehicle) {
                          return DropdownMenuItem(
                            value: vehicle,
                            child: Text(vehicle),
                          );
                        }).toList(),
                        onChanged: (String? value) {
                          setState(() {
                            selectedVehicle = value;
                          });
                        },
                      ),
                    ),
                    SizedBox(height: 16.h),
                    // Service Dropdown
                    ScaleTransition(
                      scale: _scaleAnimation,
                      child: DropdownButtonFormField<String>(
                        decoration: InputDecoration(
                          labelText: 'Select Service',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                BorderSide(color: kPrimary.withOpacity(0.5)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                BorderSide(color: kPrimary.withOpacity(0.5)),
                          ),
                          filled: true,
                          fillColor: Colors.white,
                        ),
                        value: selectedService,
                        items: services.map((String service) {
                          return DropdownMenuItem(
                            value: service,
                            child: Text(service),
                          );
                        }).toList(),
                        onChanged: (String? value) {
                          setState(() {
                            selectedService = value;
                          });
                        },
                      ),
                    ),
                    SizedBox(height: 16.h),
                    // Miles TextField
                    ScaleTransition(
                      scale: _scaleAnimation,
                      child: TextField(
                        controller: milesController,
                        decoration: InputDecoration(
                          labelText: 'Miles',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                BorderSide(color: kPrimary.withOpacity(0.5)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                BorderSide(color: kPrimary.withOpacity(0.5)),
                          ),
                          filled: true,
                          fillColor: Colors.white,
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 600.ms).slideY(begin: 0.2, end: 0),

              SizedBox(height: 24.h),

              // Report Card
              Card(
                elevation: 8,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: EdgeInsets.all(20.0.w),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Date: ${DateTime.now().toString().split(' ')[0]}',
                              style: TextStyle(
                                fontSize: 16.sp,
                                color: Colors.grey[700],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Container(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 12.w, vertical: 6.h),
                              decoration: BoxDecoration(
                                color: kPrimary,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                'CH002',
                                style: TextStyle(
                                  fontSize: 18.sp,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ),
                        Divider(height: 24.h, color: kPrimary.withOpacity(0.2)),
                        Text(
                          'Engine: DD15',
                          style: TextStyle(
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey[800],
                          ),
                        ),
                        SizedBox(height: 8.h),
                        Text(
                          'Service: Oil Change',
                          style: TextStyle(
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey[800],
                          ),
                        ),
                        SizedBox(height: 8.h),
                        Text(
                          'Company Name: Detroit',
                          style: TextStyle(
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey[800],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )
                  .animate()
                  .fadeIn(duration: 800.ms, delay: 200.ms)
                  .slideX(begin: 0.2, end: 0),
            ],
          ),
        ),
      ),
    );
  }
}
