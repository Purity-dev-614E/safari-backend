const analyticsModel = require('../models/analyticsModel');

module.exports = {
  // Group Analytics
  async getGroupDemographics(groupId) {
    return analyticsModel.getGroupDemographics(groupId);
  },
  
  async getGroupAttendanceStats(groupId) {
    return analyticsModel.getGroupAttendanceStats(groupId);
  },
  
  async getGroupGrowthAnalytics(groupId) {
    return analyticsModel.getGroupGrowthAnalytics(groupId);
  },
  
  async compareGroups(groupIds) {
    return analyticsModel.compareGroups(groupIds);
  },
  
  async getGroupEngagementMetrics(groupId) {
    return analyticsModel.getGroupEngagementMetrics(groupId);
  },
  
  async getGroupActivityTimeline(groupId) {
    return analyticsModel.getGroupActivityTimeline(groupId);
  },
  
  // Attendance Analytics
  async getAttendanceByPeriod(period) {
    return analyticsModel.getAttendanceByPeriod(period);
  },
  
  async getOverallAttendanceByPeriod(period) {
    return analyticsModel.getOverallAttendanceByPeriod(period);
  },
  
  async getUserAttendanceTrends(userId) {
    return analyticsModel.getUserAttendanceTrends(userId);
  },
  
  async getGroupAttendanceTrends(groupId) {
    return analyticsModel.getGroupAttendanceTrends(groupId);
  },
  
  async getAttendanceByEventType(eventType) {
    return analyticsModel.getAttendanceByEventType(eventType);
  },
  
  // Event Analytics
  async getEventParticipationStats(eventId) {
    return analyticsModel.getEventParticipationStats(eventId);
  },
  
  async compareEventAttendance(eventIds) {
    return analyticsModel.compareEventAttendance(eventIds);
  },
  
  async getUpcomingEventsParticipationForecast() {
    return analyticsModel.getUpcomingEventsParticipationForecast();
  },
  
  async getPopularEvents() {
    return analyticsModel.getPopularEvents();
  },
  
  async getAttendanceByEventCategory() {
    return analyticsModel.getAttendanceByEventCategory();
  },
  
  // Member Analytics
  async getMemberParticipationStats() {
    return analyticsModel.getMemberParticipationStats();
  },
  
  async getMemberRetentionStats() {
    return analyticsModel.getMemberRetentionStats();
  },
  
  async getMemberEngagementScores() {
    return analyticsModel.getMemberEngagementScores();
  },
  
  async getMemberActivityLevels() {
    return analyticsModel.getMemberActivityLevels();
  },
  
  async getAttendanceCorrelationFactors() {
    return analyticsModel.getAttendanceCorrelationFactors();
  },
  
  // Dashboard Analytics
  async getDashboardSummary() {
    return analyticsModel.getDashboardSummary();
  },
  
  async getGroupDashboardData(groupId) {
    return analyticsModel.getGroupDashboardData(groupId);
  },
  
  async getDashboardTrends() {
    return analyticsModel.getDashboardTrends();
  },
  
  async getPerformanceMetrics() {
    return analyticsModel.getPerformanceMetrics();
  },
  
  async getCustomDashboardData(timeframe) {
    return analyticsModel.getCustomDashboardData(timeframe);
  },
  
  // Export Analytics
  async exportAttendanceReport() {
    return analyticsModel.exportAttendanceReport();
  },
  
  async exportMemberReport() {
    return analyticsModel.exportMemberReport();
  },
  
  async exportGroupReport(groupId) {
    return analyticsModel.exportGroupReport(groupId);
  }
}; 