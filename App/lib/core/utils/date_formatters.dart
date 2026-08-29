import 'package:intl/intl.dart';

class DateFormatters {
  static final DateFormat _date = DateFormat('dd MMM yyyy');
  static final DateFormat _dateTime = DateFormat('dd MMM yyyy, hh:mm a');

  static String date(DateTime? value) {
    if (value == null) return '—';
    return _date.format(value.toLocal());
  }

  static String dateTime(DateTime? value) {
    if (value == null) return '—';
    return _dateTime.format(value.toLocal());
  }

  static String relative(DateTime? value) {
    if (value == null) return '—';
    final local = value.toLocal();
    final now = DateTime.now();
    final diff = now.difference(local);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} hr ago';
    if (diff.inDays < 7) {
      return '${diff.inDays} day${diff.inDays == 1 ? '' : 's'} ago';
    }
    return date(local);
  }
}
