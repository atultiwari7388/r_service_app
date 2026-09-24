import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import 'package:regal_service_d_app/services/google_places_service.dart';
import 'package:regal_service_d_app/utils/app_styles.dart';
import 'package:regal_service_d_app/utils/constants.dart';

class GooglePlaceSearchBottomSheet extends StatefulWidget {
  final String? initialQuery;

  const GooglePlaceSearchBottomSheet({
    Key? key,
    this.initialQuery,
  }) : super(key: key);

  static Future<PlaceDetails?> show(
    BuildContext context, {
    String? initialQuery,
  }) {
    return showModalBottomSheet<PlaceDetails>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => GooglePlaceSearchBottomSheet(
        initialQuery: initialQuery,
      ),
    );
  }

  @override
  State<GooglePlaceSearchBottomSheet> createState() =>
      _GooglePlaceSearchBottomSheetState();
}

class _GooglePlaceSearchBottomSheetState
    extends State<GooglePlaceSearchBottomSheet> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  Timer? _debounceTimer;

  List<PlacePrediction> _predictions = [];
  bool _isLoading = false;
  String? _loadingPlaceId;
  String _sessionToken = '';

  @override
  void initState() {
    super.initState();
    _sessionToken = DateTime.now().millisecondsSinceEpoch.toString();
    if (widget.initialQuery != null && widget.initialQuery!.isNotEmpty) {
      _searchController.text = widget.initialQuery!;
      _onSearchChanged(widget.initialQuery!);
    }
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounceTimer?.cancel();
    if (query.trim().isEmpty) {
      setState(() {
        _predictions = [];
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
    });

    _debounceTimer = Timer(const Duration(milliseconds: 350), () async {
      final results = await GooglePlacesService.getPredictions(
        query.trim(),
        sessionToken: _sessionToken,
      );
      if (mounted) {
        setState(() {
          _predictions = results;
          _isLoading = false;
        });
      }
    });
  }

  Future<void> _selectPlace(PlacePrediction prediction) async {
    setState(() {
      _loadingPlaceId = prediction.placeId;
    });

    final details = await GooglePlacesService.getPlaceDetails(
      prediction.placeId,
      sessionToken: _sessionToken,
    );

    if (mounted) {
      setState(() {
        _loadingPlaceId = null;
      });

      if (details != null) {
        Navigator.of(context).pop(details);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Failed to retrieve place details. Please try again."),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      padding: EdgeInsets.only(bottom: bottomInset),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24.r),
          topRight: Radius.circular(24.r),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Column(
        children: [
          // Drag handle
          SizedBox(height: 12.h),
          Container(
            width: 40.w,
            height: 4.h,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2.r),
            ),
          ),
          SizedBox(height: 12.h),

          // Header
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 20.w),
            child: Row(
              children: [
                Container(
                  padding: EdgeInsets.all(8.r),
                  decoration: BoxDecoration(
                    color: kPrimary.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    MaterialCommunityIcons.google_maps,
                    color: kPrimary,
                    size: 22.sp,
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Search Address",
                        style: appStyle(18, kDark, FontWeight.bold),
                      ),
                      Text(
                        "Search to auto-fill street, city, state & country",
                        style: appStyle(12, kGray, FontWeight.normal),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: kDarkGray),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
          SizedBox(height: 14.h),

          // Search Input Bar
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 20.w),
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xffF6F7FB),
                borderRadius: BorderRadius.circular(14.r),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: TextField(
                controller: _searchController,
                focusNode: _focusNode,
                autofocus: true,
                onChanged: _onSearchChanged,
                style: appStyle(14, kDark, FontWeight.w500),
                decoration: InputDecoration(
                  hintText: "Type street address or place...",
                  hintStyle: appStyle(14, kGrayLight, FontWeight.normal),
                  prefixIcon: Icon(
                    Icons.search,
                    color: kPrimary,
                    size: 22.sp,
                  ),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: Icon(
                            Icons.clear,
                            color: Colors.grey.shade500,
                            size: 18.sp,
                          ),
                          onPressed: () {
                            _searchController.clear();
                            _onSearchChanged('');
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 16.w,
                    vertical: 14.h,
                  ),
                ),
              ),
            ),
          ),
          SizedBox(height: 10.h),

          if (_isLoading)
            LinearProgressIndicator(
              backgroundColor: kPrimary.withOpacity(0.1),
              valueColor: const AlwaysStoppedAnimation<Color>(kPrimary),
              minHeight: 2.h,
            )
          else
            Divider(height: 1, color: Colors.grey.shade200),

          // Results List / Empty States
          Expanded(
            child: _buildBody(),
          ),

          // Google Attribution Footer
          Container(
            padding: EdgeInsets.symmetric(vertical: 8.h),
            decoration: BoxDecoration(
              color: const Color(0xffF9FAFC),
              border: Border(
                top: BorderSide(color: Colors.grey.shade200, width: 1),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  MaterialCommunityIcons.google,
                  size: 14.sp,
                  color: Colors.grey.shade600,
                ),
                SizedBox(width: 4.w),
                Text(
                  "Powered by Google",
                  style: appStyle(11, Colors.grey.shade600, FontWeight.w500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_searchController.text.trim().isEmpty) {
      return Center(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 40.w),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: EdgeInsets.all(20.r),
                decoration: BoxDecoration(
                  color: kPrimary.withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  MaterialCommunityIcons.map_marker_radius_outline,
                  size: 48.sp,
                  color: kPrimary,
                ),
              ),
              SizedBox(height: 16.h),
              Text(
                "Find Your Location",
                style: appStyle(16, kDark, FontWeight.bold),
              ),
              SizedBox(height: 6.h),
              Text(
                "Type your building, street, or city name to automatically complete address details.",
                textAlign: TextAlign.center,
                style: appStyle(13, kGray, FontWeight.normal),
              ),
            ],
          ),
        ),
      );
    }

    if (!_isLoading && _predictions.isEmpty) {
      return Center(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 40.w),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                MaterialCommunityIcons.map_marker_remove_outline,
                size: 44.sp,
                color: Colors.grey.shade400,
              ),
              SizedBox(height: 12.h),
              Text(
                "No addresses found",
                style: appStyle(15, kDark, FontWeight.w600),
              ),
              SizedBox(height: 4.h),
              Text(
                "Please check the spelling or try searching with a city or zip code.",
                textAlign: TextAlign.center,
                style: appStyle(12, kGray, FontWeight.normal),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
      itemCount: _predictions.length,
      separatorBuilder: (context, index) => Divider(
        height: 1,
        color: Colors.grey.shade100,
        indent: 44.w,
      ),
      itemBuilder: (context, index) {
        final prediction = _predictions[index];
        final isSelected = _loadingPlaceId == prediction.placeId;

        return InkWell(
          onTap: isSelected ? null : () => _selectPlace(prediction),
          borderRadius: BorderRadius.circular(12.r),
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 12.h),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  margin: EdgeInsets.only(top: 2.h),
                  padding: EdgeInsets.all(6.r),
                  decoration: BoxDecoration(
                    color: kPrimary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8.r),
                  ),
                  child: isSelected
                      ? SizedBox(
                          width: 16.sp,
                          height: 16.sp,
                          child: const CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(kPrimary),
                          ),
                        )
                      : Icon(
                          MaterialCommunityIcons.map_marker_outline,
                          color: kPrimary,
                          size: 18.sp,
                        ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        prediction.mainText,
                        style: appStyle(14, kDark, FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (prediction.secondaryText.isNotEmpty) ...[
                        SizedBox(height: 2.h),
                        Text(
                          prediction.secondaryText,
                          style: appStyle(12, kGray, FontWeight.normal),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 14.sp,
                  color: Colors.grey.shade400,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
