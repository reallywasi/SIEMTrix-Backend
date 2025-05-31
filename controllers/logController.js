const Log = require('../models/Log');

// Helper function to calculate duration in minutes
const calculateDuration = (startTime, endTime) => {
  const diffMs = new Date(endTime) - new Date(startTime);
  return diffMs / 1000 / 60; // Convert milliseconds to minutes
};

// Helper function to format duration as "Xh Ym"
const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
};

// Controller to fetch logs and calculate productivity/distraction time
exports.getProductivityData = async (req, res) => {
  try {
    // Query logs for a specific day (default: May 31, 2025)
    const date = req.query.date ? new Date(req.query.date) : new Date('2025-05-31');
    const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999));
    const logs = await Log.find({
      time: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ time: 1 }); // Sort by time ascending

    if (!logs.length) {
      return res.status(404).json({ message: 'No logs found for the specified date' });
    }

    // Calculate durations and aggregate times
    let productivityTime = 0; // in minutes
    let distractionTime = 0; // in minutes
    const activities = [];
    const distractionIntervals = [];

    for (let i = 0; i < logs.length; i++) {
      const currentLog = logs[i];
      let duration = 0;

      // Calculate duration: time to next log with different url or category
      if (i < logs.length - 1) {
        const nextLog = logs[i + 1];
        const isDifferent = currentLog.url !== nextLog.url || currentLog.category !== nextLog.category;
        if (isDifferent) {
          duration = calculateDuration(currentLog.time, nextLog.time);
        } else {
          // Skip if same url/category (e.g., multiple Netflix logs)
          continue;
        }
      } else {
        // Last log: assume 5-minute default duration
        duration = 5;
      }

      // Cap distraction duration at 30 minutes to avoid unrealistic gaps
      if (currentLog.productivity === 'Distracting' && duration > 30) {
        duration = 30;
      }

      // Aggregate times
      if (currentLog.productivity === 'Productive') {
        productivityTime += duration;
        activities.push({
          name: currentLog.log.includes('leetcode.com')
            ? 'LeetCode'
            : currentLog.log.includes('github.com')
            ? 'GitHub'
            : currentLog.log.includes('Visual Studio Code')
            ? 'Visual Studio Code'
            : currentLog.category,
          category: currentLog.category,
          duration: formatDuration(duration),
          durationMinutes: duration,
          activity_type:
            currentLog.category === 'Code Editor'
              ? 'Active Coding'
              : currentLog.category === 'Version Control'
              ? 'Research'
              : currentLog.category === 'Problem Solving'
              ? 'Research'
              : currentLog.category === 'Testing'
              ? 'Testing'
              : 'Other',
        });
      } else if (currentLog.productivity === 'Distracting') {
        distractionTime += duration;
        distractionIntervals.push({
          name: currentLog.log.includes('youtube.com')
            ? 'YouTube'
            : currentLog.log.includes('netflix.com')
            ? 'Netflix'
            : currentLog.category,
          time: currentLog.time,
          duration: formatDuration(duration),
          durationMinutes: duration,
        });
      }
    }

    // Calculate focus score
    const totalTime = productivityTime + distractionTime;
    const focusScore = totalTime > 0 ? Math.round((productivityTime / totalTime) * 100) : 0;

    // Prepare response
    const response = {
      productivityTime: formatDuration(productivityTime),
      distractionTime: formatDuration(distractionTime),
      focusScore: `${focusScore}%`,
      activities, // For Top Productive Websites & Apps
      distractionIntervals, // For Distraction Intervals
      timeline: logs.map((log) => ({
        time: log.time,
        category: log.category,
        productivity: log.productivity,
        activity_type:
          log.category === 'Code Editor'
            ? 'Active Coding'
            : log.category === 'Version Control'
            ? 'Research'
            : log.category === 'Problem Solving'
            ? 'Research'
            : log.category === 'Testing'
            ? 'Testing'
            : 'Other',
      })),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(`Error fetching logs: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};