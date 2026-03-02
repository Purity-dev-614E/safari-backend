# Dart/Flutter Leadership Events Integration Guide

## Overview

This guide provides complete integration instructions for implementing leadership events functionality in your Dart/Flutter application. The backend now supports dedicated endpoints for leadership events with proper RC/admin resolution and attendance tracking.

## Key Issues Resolved

1. **Event Details Crash** - Fixed null groupId handling for leadership events
2. **Missing RC/Admin Names** - Added participant resolution endpoint
3. **Zero Invites Display** - Added dedicated leadership events route with participant counts
4. **Attendance Marking** - Added dedicated attendance endpoint for leadership events

## API Endpoints Summary

### Leadership Events
- `GET /api/events/leadership` - Get leadership events with participant counts
- `POST /api/events/leadership` - Create leadership event
- `GET /api/events/:id/participants` - Get leadership event participants
- `POST /api/attendance/leadership/:eventId` - Mark attendance for leadership events

### Regular Events (Unchanged)
- `GET /api/events/` - Get all events (filtered by user role)
- `POST /api/events/group/:groupId` - Create group event
- `POST /api/attendance/event/:eventId` - Mark attendance for regular events

## Dart Implementation

### 1. Event Model Updates

```dart
class Event {
  final String id;
  final String title;
  final String description;
  final DateTime date;
  final String location;
  final String tag; // 'org' or 'leadership'
  final String? groupId;
  final String? targetAudience; // 'all', 'rc_only', 'regional'
  final String? regionId;
  final int? participantCount;
  final int? invitedCount;

  Event({
    required this.id,
    required this.title,
    required this.description,
    required this.date,
    required this.location,
    required this.tag,
    this.groupId,
    this.targetAudience,
    this.regionId,
    this.participantCount,
    this.invitedCount,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      date: DateTime.parse(json['date']),
      location: json['location'] ?? '',
      tag: json['tag'] ?? 'org',
      groupId: json['group_id'],
      targetAudience: json['target_audience'],
      regionId: json['region_id'],
      participantCount: json['participant_count'] != null 
          ? int.parse(json['participant_count'].toString()) 
          : null,
      invitedCount: json['invited_count'] != null 
          ? int.parse(json['invited_count'].toString()) 
          : null,
    );
  }

  bool get isLeadershipEvent => tag == 'leadership';
  bool get hasGroup => groupId != null;
}
```

### 2. Participant Model

```dart
class Participant {
  final String id;
  final String fullName;
  final String email;
  final String role;
  final String? regionId;

  Participant({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    this.regionId,
  });

  factory Participant.fromJson(Map<String, dynamic> json) {
    return Participant(
      id: json['id'] ?? '',
      fullName: json['full_name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? '',
      regionId: json['region_id'],
    );
  }
}
```

### 3. API Service

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class EventApiService {
  final String baseUrl;
  final String token;

  EventApiService({required this.baseUrl, required this.token});

  Map<String, String> get headers => {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  };

  // Get leadership events
  Future<List<Event>> getLeadershipEvents() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/events/leadership'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      List<dynamic> jsonList = json.decode(response.body);
      return jsonList.map((json) => Event.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load leadership events: ${response.body}');
    }
  }

  // Get all events (existing method - enhanced)
  Future<List<Event>> getAllEvents() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/events/'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      List<dynamic> jsonList = json.decode(response.body);
      return jsonList.map((json) => Event.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load events: ${response.body}');
    }
  }

  // Get leadership event participants
  Future<List<Participant>> getLeadershipEventParticipants(
    String eventId, {
    String? targetAudience,
  }) async {
    String url = '$baseUrl/api/events/$eventId/participants';
    if (targetAudience != null) {
      url += '?target_audience=$targetAudience';
    }

    final response = await http.get(
      Uri.parse(url),
      headers: headers,
    );

    if (response.statusCode == 200) {
      List<dynamic> jsonList = json.decode(response.body);
      return jsonList.map((json) => Participant.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load participants: ${response.body}');
    }
  }

  // Create leadership event
  Future<Event> createLeadershipEvent({
    required String title,
    required String description,
    required DateTime date,
    required String location,
    String targetAudience = 'all',
    String? regionId,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/events/leadership'),
      headers: headers,
      body: json.encode({
        'title': title,
        'description': description,
        'date': date.toIso8601String(),
        'location': location,
        'tag': 'leadership',
        'target_audience': targetAudience,
        'region_id': regionId,
      }),
    );

    if (response.statusCode == 201) {
      return Event.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to create leadership event: ${response.body}');
    }
  }

  // Create regular event (existing method)
  Future<Event> createRegularEvent({
    required String groupId,
    required String title,
    required String description,
    required DateTime date,
    required String location,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/events/group/$groupId'),
      headers: headers,
      body: json.encode({
        'title': title,
        'description': description,
        'date': date.toIso8601String(),
        'location': location,
        'tag': 'org',
      }),
    );

    if (response.statusCode == 201) {
      return Event.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to create event: ${response.body}');
    }
  }

  // Mark attendance for leadership events
  Future<void> markLeadershipAttendance({
    required String eventId,
    required String userId,
    required bool present,
    String? notes,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/attendance/leadership/$eventId'),
      headers: headers,
      body: json.encode({
        'user_id': userId,
        'present': present,
        'notes': notes ?? '',
      }),
    );

    if (response.statusCode != 201) {
      throw Exception('Failed to mark attendance: ${response.body}');
    }
  }

  // Mark attendance for regular events (existing method)
  Future<void> markRegularAttendance({
    required String eventId,
    required String userId,
    required bool present,
    String? notes,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/attendance/event/$eventId'),
      headers: headers,
      body: json.encode({
        'user_id': userId,
        'present': present,
        'notes': notes ?? '',
      }),
    );

    if (response.statusCode != 201) {
      throw Exception('Failed to mark attendance: ${response.body}');
    }
  }
}
```

### 4. Event Details Screen Fix

```dart
class EventDetailsScreen extends StatefulWidget {
  final Event event;

  const EventDetailsScreen({Key? key, required this.event}) : super(key: key);

  @override
  _EventDetailsScreenState createState() => _EventDetailsScreenState();
}

class _EventDetailsScreenState extends State<EventDetailsScreen> {
  final EventApiService _apiService = EventApiService(
    baseUrl: 'https://your-api-url.com',
    token: 'your-auth-token',
  );

  List<dynamic> _members = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadEventMembers();
  }

  Future<void> _loadEventMembers() async {
    setState(() => _isLoading = true);

    try {
      if (widget.event.isLeadershipEvent) {
        // Use new leadership events endpoint
        final participants = await _apiService.getLeadershipEventParticipants(
          widget.event.id,
        );
        setState(() => _members = participants);
      } else {
        // Use existing group members logic
        final members = await _groupProvider.getGroupMembers(widget.event.groupId!);
        setState(() => _members = members);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.event.isLeadershipEvent 
                ? 'Failed to load leadership event participants'
                : 'Failed to load group members',
          ),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.event.title),
      ),
      body: Column(
        children: [
          // Event details
          _buildEventDetails(),
          
          // Attendance overview
          _buildAttendanceOverview(),
          
          // Members list
          if (_isLoading)
            const CircularProgressIndicator()
          else
            Expanded(
              child: ListView.builder(
                itemCount: _members.length,
                itemBuilder: (context, index) {
                  final member = _members[index];
                  return _buildMemberTile(member);
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEventDetails() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.event.title,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(widget.event.description),
          const SizedBox(height: 8),
          Text('Date: ${widget.event.date.toString().split('.')[0]}'),
          Text('Location: ${widget.event.location}'),
          if (widget.event.isLeadershipEvent) ...[
            const SizedBox(height: 8),
            Chip(
              label: Text('Leadership Event'),
              backgroundColor: Colors.blue.shade100,
            ),
            if (widget.event.targetAudience != null)
              Chip(
                label: Text('Target: ${widget.event.targetAudience}'),
                backgroundColor: Colors.green.shade100,
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildAttendanceOverview() {
    final invitedCount = widget.event.invitedCount ?? _members.length;
    final attendedCount = _members.where((m) => m['present'] == true).length;

    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Column(
            children: [
              Text(
                invitedCount.toString(),
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              Text('Invited'),
            ],
          ),
          Column(
            children: [
              Text(
                attendedCount.toString(),
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              Text('Attended'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMemberTile(dynamic member) {
    final name = member is Participant ? member.fullName : member['name'] ?? 'Unknown';
    final email = member is Participant ? member.email : member['email'] ?? '';
    final role = member is Participant ? member.role : member['role'] ?? '';

    return ListTile(
      leading: CircleAvatar(
        child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?'),
      ),
      title: Text(name),
      subtitle: Text(email),
      trailing: member is Participant 
          ? Chip(label: Text(role.toUpperCase()))
          : null,
      onTap: () => _markAttendance(member),
    );
  }

  Future<void> _markAttendance(dynamic member) async {
    try {
      final userId = member is Participant ? member.id : member['id'];
      
      if (widget.event.isLeadershipEvent) {
        await _apiService.markLeadershipAttendance(
          eventId: widget.event.id,
          userId: userId,
          present: true,
        );
      } else {
        await _apiService.markRegularAttendance(
          eventId: widget.event.id,
          userId: userId,
          present: true,
        );
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Attendance marked successfully'),
          backgroundColor: Colors.green,
        ),
      );
      
      // Refresh the member list
      await _loadEventMembers();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to mark attendance: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
```

### 5. Event Creation Form Updates

```dart
class CreateEventScreen extends StatefulWidget {
  @override
  _CreateEventScreenState createState() => _CreateEventScreenState();
}

class _CreateEventScreenState extends State<CreateEventScreen> {
  final _formKey = GlobalKey<FormState>();
  final EventApiService _apiService = EventApiService(
    baseUrl: 'https://your-api-url.com',
    token: 'your-auth-token',
  );

  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  
  String _eventType = 'org'; // 'org' or 'leadership'
  String _targetAudience = 'all'; // 'all', 'rc_only', 'regional'
  String? _selectedGroupId;
  String? _selectedRegionId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Create Event'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Event type selection
            _buildEventTypeSelection(),
            
            // Common fields
            TextFormField(
              controller: _titleController,
              decoration: InputDecoration(labelText: 'Event Title'),
              validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
            ),
            TextFormField(
              controller: _descriptionController,
              decoration: InputDecoration(labelText: 'Description'),
              maxLines: 3,
              validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
            ),
            TextFormField(
              controller: _locationController,
              decoration: InputDecoration(labelText: 'Location'),
              validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
            ),
            ListTile(
              title: Text('Date: ${_selectedDate.toString().split('.')[0]}'),
              trailing: Icon(Icons.calendar_today),
              onTap: _selectDate,
            ),
            
            // Conditional fields based on event type
            if (_eventType == 'leadership') ...[
              _buildTargetAudienceSelection(),
              if (_targetAudience == 'regional') _buildRegionSelection(),
            ] else ...[
              _buildGroupSelection(),
            ],
            
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _createEvent,
              child: Text('Create Event'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEventTypeSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Event Type', style: Theme.of(context).textTheme.titleMedium),
        Row(
          children: [
            Expanded(
              child: RadioListTile<String>(
                title: Text('Group Event'),
                value: 'org',
                groupValue: _eventType,
                onChanged: (value) => setState(() => _eventType = value!),
              ),
            ),
            Expanded(
              child: RadioListTile<String>(
                title: Text('Leadership Event'),
                value: 'leadership',
                groupValue: _eventType,
                onChanged: (value) => setState(() => _eventType = value!),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTargetAudienceSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Target Audience', style: Theme.of(context).textTheme.titleMedium),
        RadioListTile<String>(
          title: Text('All RCs and Admins'),
          value: 'all',
          groupValue: _targetAudience,
          onChanged: (value) => setState(() => _targetAudience = value!),
        ),
        RadioListTile<String>(
          title: Text('RCs Only'),
          value: 'rc_only',
          groupValue: _targetAudience,
          onChanged: (value) => setState(() => _targetAudience = value!),
        ),
        RadioListTile<String>(
          title: Text('Regional Only'),
          value: 'regional',
          groupValue: _targetAudience,
          onChanged: (value) => setState(() => _targetAudience = value!),
        ),
      ],
    );
  }

  Widget _buildRegionSelection() {
    // Implement region selection dropdown
    return DropdownButtonFormField<String>(
      decoration: InputDecoration(labelText: 'Select Region'),
      value: _selectedRegionId,
      items: [
        DropdownMenuItem(value: 'region1', child: Text('Region 1')),
        DropdownMenuItem(value: 'region2', child: Text('Region 2')),
        // Add more regions as needed
      ],
      onChanged: (value) => setState(() => _selectedRegionId = value),
    );
  }

  Widget _buildGroupSelection() {
    // Implement group selection dropdown
    return DropdownButtonFormField<String>(
      decoration: InputDecoration(labelText: 'Select Group'),
      value: _selectedGroupId,
      items: [
        DropdownMenuItem(value: 'group1', child: Text('Group 1')),
        DropdownMenuItem(value: 'group2', child: Text('Group 2')),
        // Add more groups as needed
      ],
      onChanged: (value) => setState(() => _selectedGroupId = value),
    );
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(Duration(days: 365)),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _createEvent() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      Event event;

      if (_eventType == 'leadership') {
        event = await _apiService.createLeadershipEvent(
          title: _titleController.text,
          description: _descriptionController.text,
          date: _selectedDate,
          location: _locationController.text,
          targetAudience: _targetAudience,
          regionId: _targetAudience == 'regional' ? _selectedRegionId : null,
        );
      } else {
        if (_selectedGroupId == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Please select a group')),
          );
          return;
        }

        event = await _apiService.createRegularEvent(
          groupId: _selectedGroupId!,
          title: _titleController.text,
          description: _descriptionController.text,
          date: _selectedDate,
          location: _locationController.text,
        );
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Event created successfully'),
          backgroundColor: Colors.green,
        ),
      );
      
      Navigator.pop(context, event);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to create event: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
```

### 6. Events List Screen Updates

```dart
class EventsListScreen extends StatefulWidget {
  @override
  _EventsListScreenState createState() => _EventsListScreenState();
}

class _EventsListScreenState extends State<EventsListScreen> {
  final EventApiService _apiService = EventApiService(
    baseUrl: 'https://your-api-url.com',
    token: 'your-auth-token',
  );

  List<Event> _events = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadEvents();
  }

  Future<void> _loadEvents() async {
    setState(() => _isLoading = true);

    try {
      // Load both regular and leadership events
      final regularEvents = await _apiService.getAllEvents();
      final leadershipEvents = await _apiService.getLeadershipEvents();
      
      // Combine and sort by date
      final allEvents = [...regularEvents, ...leadershipEvents];
      allEvents.sort((a, b) => b.date.compareTo(a.date));
      
      setState(() => _events = allEvents);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to load events: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Events'),
        actions: [
          IconButton(
            icon: Icon(Icons.add),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => CreateEventScreen()),
            ).then((_) => _loadEvents()),
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _events.length,
              itemBuilder: (context, index) {
                final event = _events[index];
                return _buildEventTile(event);
              },
            ),
    );
  }

  Widget _buildEventTile(Event event) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: ListTile(
        title: Text(event.title),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(event.description),
            Text('Date: ${event.date.toString().split('.')[0]}'),
            Text('Location: ${event.location}'),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (event.isLeadershipEvent)
              Chip(
                label: Text('Leadership'),
                backgroundColor: Colors.blue.shade100,
              ),
            if (event.invitedCount != null)
              Text('${event.invitedCount} invited'),
          ],
        ),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => EventDetailsScreen(event: event),
          ),
        ).then((_) => _loadEvents()),
      ),
    );
  }
}
```

## Testing Scenarios

### 1. Leadership Event Details Test
```dart
testWidgets('Leadership event details load without crash', (tester) async {
  final mockEvent = Event(
    id: 'test-id',
    title: 'Test Leadership Event',
    description: 'Test Description',
    date: DateTime.now(),
    location: 'Test Location',
    tag: 'leadership',
    groupId: null, // This should not cause crash
  );

  await tester.pumpWidget(
    MaterialApp(
      home: EventDetailsScreen(event: mockEvent),
    ),
  );

  // Should load participants without crashing
  expect(find.byType(CircularProgressIndicator), findsOneWidget);
  await tester.pumpAndSettle();
  expect(find.byType(ListView), findsOneWidget);
});
```

### 2. Target Audience Filtering Test
```dart
testWidgets('Target audience filtering works', (tester) async {
  // Test different target audiences in leadership events
  final apiService = EventApiService(
    baseUrl: 'test-api',
    token: 'test-token',
  );

  // Test 'all' audience
  final allParticipants = await apiService.getLeadershipEventParticipants(
    'event-id',
    targetAudience: 'all',
  );

  // Test 'rc_only' audience
  final rcOnlyParticipants = await apiService.getLeadershipEventParticipants(
    'event-id',
    targetAudience: 'rc_only',
  );

  expect(rcOnlyParticipants.every((p) => p.role == 'rc'), true);
});
```

## Error Handling

### Common Error Messages
```dart
class ApiErrorHandler {
  static String getErrorMessage(int statusCode, String responseBody) {
    switch (statusCode) {
      case 400:
        if (responseBody.contains('leadership')) {
          return 'This action is only available for leadership events';
        }
        return 'Invalid request data';
      case 403:
        return 'You do not have permission to perform this action';
      case 404:
        return 'Event not found';
      case 500:
        return 'Server error. Please try again later';
      default:
        return 'An error occurred';
    }
  }
}
```

## Migration Steps

1. **Update Models**
   - Add `tag`, `targetAudience`, `participantCount` to Event model
   - Create Participant model

2. **Update API Service**
   - Add leadership event endpoints
   - Add conditional logic for event type handling

3. **Update UI Components**
   - Event details screen with conditional member loading
   - Event creation form with event type selection
   - Events list with leadership event indicators

4. **Add Error Handling**
   - Specific error messages for leadership events
   - Graceful fallbacks for API failures

5. **Test Integration**
   - Create leadership events
   - Verify participant lists load correctly
   - Test attendance marking for both event types

## Quick Integration Checklist

- [ ] Event model updated with leadership fields
- [ ] API service includes leadership endpoints
- [ ] Event details screen handles null groupId
- [ ] Event creation form has leadership event option
- [ ] Target audience selection implemented
- [ ] Attendance marking uses correct endpoint
- [ ] Error handling added for leadership events
- [ ] UI shows leadership event indicators
- [ ] Participant counts display correctly

---

**Priority:** HIGH - Complete leadership events integration  
**Impact:** Resolves crashes and adds full leadership event functionality  
**Backend Status:** ✅ All endpoints ready  
**Frontend Action:** Implement using the code examples above
