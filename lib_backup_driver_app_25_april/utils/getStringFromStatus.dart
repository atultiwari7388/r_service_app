String getStringFromTripStatus(int status) {
  if (status == 1) {
    return 'Ongoing';
  } else if (status == 2) {
    return 'Completed';
  }
  return 'Pending';
}



int getIntFromTripStatus(String status) {
  if (status == 'Started') {
    return 1;
  } else if (status == 'Completed') {
    return 2;
  }
  return 0;
}