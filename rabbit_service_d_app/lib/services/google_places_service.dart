import 'dart:convert';
import 'dart:developer';
import 'package:http/http.dart' as http;
import 'package:regal_service_d_app/utils/constants.dart';

class PlacePrediction {
  final String placeId;
  final String description;
  final String mainText;
  final String secondaryText;

  PlacePrediction({
    required this.placeId,
    required this.description,
    required this.mainText,
    required this.secondaryText,
  });

  factory PlacePrediction.fromJson(Map<String, dynamic> json) {
    final structuredFormatting = json['structured_formatting'] ?? {};
    return PlacePrediction(
      placeId: json['place_id'] ?? '',
      description: json['description'] ?? '',
      mainText: structuredFormatting['main_text'] ?? json['description'] ?? '',
      secondaryText: structuredFormatting['secondary_text'] ?? '',
    );
  }
}

class PlaceDetails {
  final String formattedAddress;
  final String streetAddress;
  final String streetNumber;
  final String route;
  final String city;
  final String state;
  final String postalCode;
  final String country;
  final String countryCode;
  final double? lat;
  final double? lng;

  PlaceDetails({
    required this.formattedAddress,
    required this.streetAddress,
    required this.streetNumber,
    required this.route,
    required this.city,
    required this.state,
    required this.postalCode,
    required this.country,
    required this.countryCode,
    this.lat,
    this.lng,
  });

  factory PlaceDetails.fromJson(Map<String, dynamic> json) {
    final result = json['result'] ?? {};
    final addressComponents =
        result['address_components'] as List<dynamic>? ?? [];

    String streetNumber = '';
    String route = '';
    String city = '';
    String state = '';
    String postalCode = '';
    String country = '';
    String countryCode = '';

    for (var component in addressComponents) {
      final types = List<String>.from(component['types'] ?? []);
      final longName = component['long_name']?.toString() ?? '';
      final shortName = component['short_name']?.toString() ?? '';

      if (types.contains('street_number')) {
        streetNumber = longName;
      } else if (types.contains('route')) {
        route = longName;
      } else if (types.contains('locality')) {
        city = longName;
      } else if (city.isEmpty && types.contains('sublocality_level_1')) {
        city = longName;
      } else if (city.isEmpty && types.contains('sublocality')) {
        city = longName;
      } else if (city.isEmpty && types.contains('postal_town')) {
        city = longName;
      } else if (city.isEmpty && types.contains('administrative_area_level_2')) {
        city = longName;
      } else if (types.contains('administrative_area_level_1')) {
        state = shortName.isNotEmpty ? shortName : longName;
      } else if (types.contains('postal_code')) {
        postalCode = longName;
      } else if (types.contains('country')) {
        country = longName;
        countryCode = shortName;
      }
    }

    final formattedAddress = result['formatted_address']?.toString() ?? '';
    final name = result['name']?.toString() ?? '';

    String streetAddress = '';
    if (streetNumber.isNotEmpty && route.isNotEmpty) {
      streetAddress = '$streetNumber $route';
    } else if (route.isNotEmpty) {
      streetAddress = route;
    } else if (streetNumber.isNotEmpty) {
      streetAddress = streetNumber;
    } else if (name.isNotEmpty) {
      streetAddress = name;
    } else {
      streetAddress = formattedAddress;
    }

    double? lat;
    double? lng;
    if (result['geometry'] != null && result['geometry']['location'] != null) {
      lat = (result['geometry']['location']['lat'] as num?)?.toDouble();
      lng = (result['geometry']['location']['lng'] as num?)?.toDouble();
    }

    return PlaceDetails(
      formattedAddress: formattedAddress,
      streetAddress: streetAddress,
      streetNumber: streetNumber,
      route: route,
      city: city,
      state: state,
      postalCode: postalCode,
      country: country,
      countryCode: countryCode,
      lat: lat,
      lng: lng,
    );
  }
}

class GooglePlacesService {
  static Future<List<PlacePrediction>> getPredictions(String input,
      {String? sessionToken}) async {
    if (input.trim().isEmpty) return [];

    try {
      String url =
          'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${Uri.encodeComponent(input)}&key=$googleApiKey';
      if (sessionToken != null && sessionToken.isNotEmpty) {
        url += '&sessiontoken=$sessionToken';
      }

      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'OK' && data['predictions'] != null) {
          final List predictions = data['predictions'];
          return predictions
              .map((p) => PlacePrediction.fromJson(p as Map<String, dynamic>))
              .toList();
        } else {
          log("Google Places Autocomplete Status: ${data['status']} - ${data['error_message'] ?? ''}");
        }
      }
    } catch (e) {
      log("Error fetching Google Places predictions: $e");
    }
    return [];
  }

  static Future<PlaceDetails?> getPlaceDetails(String placeId,
      {String? sessionToken}) async {
    if (placeId.trim().isEmpty) return null;

    try {
      String url =
          'https://maps.googleapis.com/maps/api/place/details/json?place_id=$placeId&fields=address_components,formatted_address,name,geometry&key=$googleApiKey';
      if (sessionToken != null && sessionToken.isNotEmpty) {
        url += '&sessiontoken=$sessionToken';
      }

      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'OK' && data['result'] != null) {
          return PlaceDetails.fromJson(data);
        } else {
          log("Google Places Details Status: ${data['status']} - ${data['error_message'] ?? ''}");
        }
      }
    } catch (e) {
      log("Error fetching Google Place details: $e");
    }
    return null;
  }

  static String normalizeCountryToSupportedList(
      String countryName, String countryCode) {
    final name = countryName.toLowerCase();
    final code = countryCode.toUpperCase();

    if (name.contains('united states') ||
        name == 'usa' ||
        name == 'us' ||
        code == 'US') {
      return 'USA';
    } else if (name.contains('canada') || code == 'CA') {
      return 'Canada';
    } else if (name.contains('england') ||
        name.contains('united kingdom') ||
        name.contains('great britain') ||
        name == 'uk' ||
        code == 'GB' ||
        code == 'UK') {
      return 'England';
    } else if (name.contains('australia') || code == 'AU') {
      return 'Australia';
    } else if (name.contains('mexico') || code == 'MX') {
      return 'Mexico';
    }
    return 'USA';
  }
}
