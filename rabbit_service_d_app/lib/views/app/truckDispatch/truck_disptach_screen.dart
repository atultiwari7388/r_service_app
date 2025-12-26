import 'package:flutter/material.dart';
import 'package:regal_service_d_app/utils/constants.dart';
import 'package:regal_service_d_app/views/app/truckDispatch/widgets/truck_dispatch_detail_screen.dart';

class TruckDispatchDashboard extends StatefulWidget {
  const TruckDispatchDashboard({super.key});

  @override
  State<TruckDispatchDashboard> createState() => _TruckDispatchDashboardState();
}

class _TruckDispatchDashboardState extends State<TruckDispatchDashboard>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();

  // Data Lists with Detailed Address Info
  final List<LoadData> pendingLoads = [
    LoadData(
      id: 'LD-2024-001',
      loadNumber: 'LD-2024-001',
      company: 'Amazon Logistics',
      pickupBuilding: 'Western Enterprises Yard',
      pickupAddress: '5250 North Bacus Avenue',
      pickupLocation: 'Fresno, CA, 93722',
      pickupDate: 'Jan 15, 2025',
      dropBuilding: 'Mylex Infotech Pvt Ltd',
      dropAddress: '8890 South West Avenue',
      dropLocation: 'Los Angeles, CA, 90001',
      dropDate: 'Jan 18, 2025',
      miles: '1,135 mi',
      status: 'pending',
      price: '\$2,450',
    ),
    LoadData(
      id: 'LD-2024-002',
      loadNumber: 'LD-2024-002',
      company: 'Walmart Distribution',
      pickupBuilding: 'Chicago Central Hub',
      pickupAddress: '1200 Industrial Parkway',
      pickupLocation: 'Chicago, IL, 60601',
      pickupDate: 'Jan 16, 2025',
      dropBuilding: 'East Coast Center',
      dropAddress: '4500 Commerce Blvd',
      dropLocation: 'New York, NY, 10001',
      dropDate: 'Jan 19, 2025',
      miles: '790 mi',
      status: 'pending',
      price: '\$1,850',
    ),
  ];

  final List<LoadData> activeLoads = [
    LoadData(
      id: 'LD-2024-004',
      loadNumber: 'LD-2024-004',
      company: 'Home Depot',
      pickupBuilding: 'Dallas Supply Depot',
      pickupAddress: '7780 Logistics Way',
      pickupLocation: 'Dallas, TX, 75201',
      pickupDate: 'Jan 10, 2025',
      dropBuilding: 'Mountain View Store',
      dropAddress: '2300 Rocky Road',
      dropLocation: 'Denver, CO, 80201',
      dropDate: 'Jan 12, 2025',
      miles: '880 mi',
      status: 'active',
      progress: 65,
      price: '\$1,900',
    ),
  ];

  final List<LoadData> historyLoads = [
    LoadData(
      id: 'LD-2024-006',
      loadNumber: 'LD-2024-006',
      company: 'Costco Wholesale',
      pickupBuilding: 'Portland Warehouse',
      pickupAddress: '9900 River Road',
      pickupLocation: 'Portland, OR, 97201',
      pickupDate: 'Jan 14, 2025',
      dropBuilding: 'Boise Outlet',
      dropAddress: '1100 Potato Lane',
      dropLocation: 'Boise, ID, 83701',
      dropDate: 'Jan 16, 2025',
      miles: '430 mi',
      status: 'completed',
      price: '\$1,100',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_handleTabSelection);
  }

  void _handleTabSelection() {
    if (_tabController.indexIsChanging) {
      setState(() {});
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_handleTabSelection);
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onAccept(LoadData load) {
    setState(() {
      pendingLoads.remove(load);
      activeLoads.insert(0, load.copyWith(status: 'active', progress: 0));
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${load.loadNumber} accepted successfully!'),
        behavior: SnackBarBehavior.floating,
        backgroundColor: Colors.green,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kLightWhite,
      body: Column(
        children: [
          _buildModernHeader(),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildLoadList(pendingLoads, showAcceptButton: true),
                _buildLoadList(activeLoads, showProgress: true),
                _buildLoadList(historyLoads, showCompleted: true),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModernHeader() {
    return Container(
      padding: const EdgeInsets.only(top: 50, left: 20, right: 20, bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title Row with Back Button
          Row(
            children: [
              // Back Button
              Container(
                decoration: BoxDecoration(
                  color: kLightWhite,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new,
                      size: 18, color: kDark),
                  onPressed: () {
                    if (Navigator.canPop(context)) {
                      Navigator.pop(context);
                    }
                  },
                ),
              ),
              const SizedBox(width: 16),
              // Title
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Truck Dispatch',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: kDark,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      'Manage your logistics',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[500],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              // Notification Icon
              CircleAvatar(
                radius: 22,
                backgroundColor: kPrimary.withOpacity(0.1),
                child: Icon(Icons.notifications_outlined, color: kPrimary),
              )
            ],
          ),
          const SizedBox(height: 25),

          // Custom Tab Bar with colored backgrounds
          Container(
            height: 45,
            decoration: BoxDecoration(
              color: kLightWhite,
              borderRadius: BorderRadius.circular(25),
            ),
            child: Row(
              children: [
                _buildCustomTab('Pending', 0, pendingLoads.length,
                    kPrimaryLight.withOpacity(0.8)),
                _buildCustomTab('Active', 1, activeLoads.length,
                    Colors.orange.withOpacity(0.8)),
                _buildCustomTab('History', 2, historyLoads.length,
                    kSecondary.withOpacity(0.8)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomTab(
      String text, int index, int count, Color unselectedColor) {
    final isSelected = _tabController.index == index;

    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: GestureDetector(
          onTap: () {
            _tabController.animateTo(index);
          },
          child: Container(
            height: 45,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(25),
              color: isSelected ? kPrimary : Color(0xFFE5E7EB),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: kPrimary.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : [
                      BoxShadow(
                        color: kGrayLight.withOpacity(0.3),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  text,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: isSelected ? Colors.white : kDark.withOpacity(0.6),
                  ),
                ),
                if (count > 0) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(isSelected ? 0.25 : 0.3),
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      count.toString(),
                      style: TextStyle(
                        fontSize: 10,
                        color:
                            isSelected ? Colors.white : kDark.withOpacity(0.8),
                      ),
                    ),
                  ),
                ]
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 50,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search load #, location...',
                  hintStyle: TextStyle(color: Colors.grey[400]),
                  prefixIcon: Icon(Icons.search, color: Colors.grey[400]),
                  border: InputBorder.none,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Container(
            height: 50,
            width: 50,
            decoration: BoxDecoration(
              color: kPrimary,
              borderRadius: BorderRadius.circular(15),
              boxShadow: [
                BoxShadow(
                  color: kPrimary.withOpacity(0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: IconButton(
              icon: const Icon(Icons.tune, color: Colors.white),
              onPressed: () {
                // Filter Logic
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadList(List<LoadData> loads,
      {bool showAcceptButton = false,
      bool showProgress = false,
      bool showCompleted = false}) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
      physics: const BouncingScrollPhysics(),
      itemCount: loads.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return _buildSearchBar();
        }
        final loadIndex = index - 1;
        return _buildModernCard(loads[loadIndex],
            showAcceptButton: showAcceptButton,
            showProgress: showProgress,
            showCompleted: showCompleted);
      },
    );
  }

  Widget _buildModernCard(LoadData load,
      {bool showAcceptButton = false,
      bool showProgress = false,
      bool showCompleted = false}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF64748B).withOpacity(0.12),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          // 1. Header Section
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: kLightWhite.withOpacity(0.5),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
              ),
            ),
            child: Row(
              children: [
                // Icon Box
                Container(
                  height: 48,
                  width: 48,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Center(
                    child: Text(
                      load.company.substring(0, 1),
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: kPrimary,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                // Load Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        load.loadNumber,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: kDark,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        load.company,
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                // Price Badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: kPrimary,
                    borderRadius: BorderRadius.circular(30),
                    boxShadow: [
                      BoxShadow(
                        color: kPrimary.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Text(
                    load.price ?? '\$0',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 2. Locations Section
          Padding(
            padding: const EdgeInsets.all(24),
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Timeline Visual
                  Column(
                    children: [
                      const Icon(Icons.radio_button_checked,
                          size: 20, color: kPrimary),
                      Expanded(
                        child: Container(
                          width: 2,
                          color: Colors.grey.withOpacity(0.3),
                          margin: const EdgeInsets.symmetric(vertical: 4),
                        ),
                      ),
                      Icon(Icons.location_on, size: 20, color: Colors.red[400]),
                    ],
                  ),
                  const SizedBox(width: 16),
                  // Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Pickup
                        _buildDetailedLocationBlock(
                          title: 'PICKUP',
                          building: load.pickupBuilding,
                          address: load.pickupAddress,
                          location: load.pickupLocation,
                          date: load.pickupDate,
                          dateColor: kPrimary,
                        ),
                        const SizedBox(height: 24),
                        // Drop
                        _buildDetailedLocationBlock(
                          title: 'DROP-OFF',
                          building: load.dropBuilding,
                          address: load.dropAddress,
                          location: load.dropLocation,
                          date: load.dropDate,
                          dateColor: Colors.red[400]!,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 3. Divider
          Divider(height: 1, color: Colors.grey.shade100),

          // 4. Action Footer
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                // Progress Bar if Active
                if (showProgress) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'In Transit',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey[600]),
                      ),
                      Text(
                        '${load.progress}%',
                        style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: kPrimary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: LinearProgressIndicator(
                      value: load.progress! / 100,
                      backgroundColor: kLightWhite,
                      color: kPrimary,
                      minHeight: 6,
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Action Buttons Row
                Row(
                  children: [
                    // View Button (Expanded)
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  DispatchDetailsScreen(load: load),
                            ),
                          );
                        },
                        icon: const Icon(Icons.visibility_outlined, size: 18),
                        label: const Text('View Details'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: kDark,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: BorderSide(color: Colors.grey.shade300),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    ),

                    // Accept Button (if Pending)
                    if (showAcceptButton) ...[
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => _onAccept(load),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kSecondary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: const Text(
                            'Accept',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailedLocationBlock({
    required String title,
    required String building,
    required String address,
    required String location,
    required String date,
    required Color dateColor,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Building Name
        Text(
          building,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: kDark,
          ),
        ),
        const SizedBox(height: 4),
        // Street Address
        Text(
          address,
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey[600],
            fontWeight: FontWeight.w400,
          ),
        ),
        // City State Zip
        Text(
          location,
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey[600],
            fontWeight: FontWeight.w400,
          ),
        ),
        const SizedBox(height: 6),
        // Date Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: dateColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            date,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: dateColor,
            ),
          ),
        ),
      ],
    );
  }
}

class LoadData {
  final String id;
  final String loadNumber;
  final String company;
  final String miles;
  final String status;
  final String? price;
  final int? progress;

  // Pickup Details
  final String pickupBuilding;
  final String pickupAddress;
  final String pickupLocation; // City, State, Zip
  final String pickupDate;

  // Drop Details
  final String dropBuilding;
  final String dropAddress;
  final String dropLocation; // City, State, Zip
  final String dropDate;

  LoadData({
    required this.id,
    required this.loadNumber,
    required this.company,
    required this.pickupBuilding,
    required this.pickupAddress,
    required this.pickupLocation,
    required this.pickupDate,
    required this.dropBuilding,
    required this.dropAddress,
    required this.dropLocation,
    required this.dropDate,
    required this.miles,
    required this.status,
    this.progress,
    this.price,
  });

  LoadData copyWith({
    String? status,
    int? progress,
  }) {
    return LoadData(
      id: id,
      loadNumber: loadNumber,
      company: company,
      pickupBuilding: pickupBuilding,
      pickupAddress: pickupAddress,
      pickupLocation: pickupLocation,
      pickupDate: pickupDate,
      dropBuilding: dropBuilding,
      dropAddress: dropAddress,
      dropLocation: dropLocation,
      dropDate: dropDate,
      miles: miles,
      status: status ?? this.status,
      progress: progress ?? this.progress,
      price: price,
    );
  }
}
