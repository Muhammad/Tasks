// ==========================================================================
// Tasks.assignmentsController
// ==========================================================================
/*globals CoreTasks Tasks sc_static sc_require*/

/** 

  This controller manages what is displayed in the Tasks detail screen.
  This is affected by the selected Project/User and the search criteria.
  
  @extends SC.ArrayController
  @author Joshua Holt
  @author Suvajit Gupta
*/
sc_require('core');

Tasks.attributeFilterNone = [
  CoreTasks.TASK_TYPE_FEATURE, CoreTasks.TASK_TYPE_BUG, CoreTasks.TASK_TYPE_OTHER,
  CoreTasks.TASK_PRIORITY_HIGH, CoreTasks.TASK_PRIORITY_MEDIUM, CoreTasks.TASK_PRIORITY_LOW,
  CoreTasks.STATUS_PLANNED, CoreTasks.STATUS_ACTIVE, CoreTasks.STATUS_DONE, CoreTasks.STATUS_RISKY,
  CoreTasks.TASK_VALIDATION_UNTESTED, CoreTasks.TASK_VALIDATION_PASSED, CoreTasks.TASK_VALIDATION_FAILED
];

Tasks.attributeFilterShowstoppers = [
  CoreTasks.TASK_TYPE_BUG,
  CoreTasks.TASK_PRIORITY_HIGH,
  CoreTasks.STATUS_PLANNED, CoreTasks.STATUS_ACTIVE, CoreTasks.STATUS_DONE, CoreTasks.STATUS_RISKY,
  CoreTasks.TASK_VALIDATION_FAILED
];

Tasks.attributeFilterTroubled = [
  CoreTasks.TASK_TYPE_FEATURE, CoreTasks.TASK_TYPE_BUG, CoreTasks.TASK_TYPE_OTHER,
  CoreTasks.TASK_PRIORITY_HIGH, CoreTasks.TASK_PRIORITY_MEDIUM, CoreTasks.TASK_PRIORITY_LOW,
  CoreTasks.STATUS_RISKY
];
if(Tasks.softwareMode) Tasks.attributeFilterTroubled.pushObjects([CoreTasks.STATUS_DONE, CoreTasks.TASK_VALIDATION_FAILED]);

Tasks.attributeFilterUnfinished = [
  CoreTasks.TASK_TYPE_FEATURE, CoreTasks.TASK_TYPE_BUG, CoreTasks.TASK_TYPE_OTHER,
  CoreTasks.TASK_PRIORITY_HIGH, CoreTasks.TASK_PRIORITY_MEDIUM, CoreTasks.TASK_PRIORITY_LOW,
  CoreTasks.STATUS_PLANNED, CoreTasks.STATUS_ACTIVE, CoreTasks.STATUS_RISKY
];
if(Tasks.softwareMode) Tasks.attributeFilterUnfinished.pushObjects([CoreTasks.STATUS_DONE, CoreTasks.TASK_VALIDATION_FAILED]);

Tasks.attributeFilterUnvalidated = [
  CoreTasks.TASK_TYPE_FEATURE, CoreTasks.TASK_TYPE_BUG,
  CoreTasks.TASK_PRIORITY_HIGH, CoreTasks.TASK_PRIORITY_MEDIUM, CoreTasks.TASK_PRIORITY_LOW,
  CoreTasks.STATUS_DONE,
  CoreTasks.TASK_VALIDATION_UNTESTED
];

Tasks.attributeFilterCompleted = [
CoreTasks.TASK_TYPE_FEATURE, CoreTasks.TASK_TYPE_BUG, CoreTasks.TASK_TYPE_OTHER,
  CoreTasks.TASK_PRIORITY_HIGH, CoreTasks.TASK_PRIORITY_MEDIUM, CoreTasks.TASK_PRIORITY_LOW,
  CoreTasks.STATUS_DONE,
  (Tasks.softwareMode? CoreTasks.TASK_VALIDATION_PASSED : CoreTasks.TASK_VALIDATION_UNTESTED)
];

Tasks.DISPLAY_MODE_TASKS = true;
Tasks.DISPLAY_MODE_TEAM = false;

Tasks.FILTER_DONTCARE = -1;
Tasks.FILTER_YES = 0;
Tasks.FILTER_NO = 1;

Tasks.assignmentsController = SC.ArrayController.create(
/** @scope Tasks.assignmentsController.prototype */ {
  
  // contentBinding: 'Tasks.projectController.tasks', // single-project selection mode
  contentBinding: 'Tasks.projectController.displayTasks', // multi-project selection mode
  
  assignedTasks: null,
  
  _showTasks: true,
  displayMode: function(key, value) {
    if (value !== undefined) {
      if(value === false) { // clear assignee selection before going to "TEAM" mode
        var searchFilter = this.get('searchFilter');
        if(searchFilter !== null && searchFilter !== '') {
          var assigneeSelection = searchFilter.match(/\[.*\]/);
          if (assigneeSelection) { // if assignee selection is specified
            assigneeSelection += ''; // convert to string
            searchFilter = searchFilter.replace(assigneeSelection, ''); // remove assignee selection from search filter
            this.set('searchFilter', searchFilter);
          }
        }
      }
      this.set('_showTasks', value);
    } else {
      return this.get('_showTasks');
    }
  }.property('_showTasks').cacheable(),
  
  userSelection: null,
  searchFilter: null,
  attributeFilterCriteria: Tasks.attributeFilterNone.slice(0),
  effortSpecified: Tasks.FILTER_DONTCARE,
  recentlyUpdated: Tasks.FILTER_DONTCARE,
  
  attributeFilter: function(name, value) {
    var newFilterCriteria;
    if (value !== undefined) {
      if(value) { // if not included, add attribute to filter
        if(this.attributeFilterCriteria.indexOf(name) === -1) {
          newFilterCriteria = this.attributeFilterCriteria.splice(0);
          newFilterCriteria.push(name);
          this.set('attributeFilterCriteria', newFilterCriteria);
        }
      }
      else { // if included, remove attribute from filter
        var idx = this.attributeFilterCriteria.indexOf(name);
        if (idx !== -1) {
          newFilterCriteria = this.attributeFilterCriteria.splice(0);
          newFilterCriteria.splice(idx, 1);
          this.set('attributeFilterCriteria', newFilterCriteria);
        }
      }
      return this;
    }
    else { // see if attribute is in filter
      return (this.attributeFilterCriteria.indexOf(name) !== -1);
    }
  },
  
  attributeFilterTypeFeature: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_TYPE_FEATURE, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterTypeBug: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_TYPE_BUG, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterTypeOther: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_TYPE_OTHER, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterPriorityHigh: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_PRIORITY_HIGH, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterPriorityMedium: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_PRIORITY_MEDIUM, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterPriorityLow: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_PRIORITY_LOW, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterStatusPlanned: function(key, value) {
    return this.attributeFilter(CoreTasks.STATUS_PLANNED, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterStatusActive: function(key, value) {
    return this.attributeFilter(CoreTasks.STATUS_ACTIVE, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterStatusDone: function(key, value) {
    return this.attributeFilter(CoreTasks.STATUS_DONE, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterStatusRisky: function(key, value) {
    return this.attributeFilter(CoreTasks.STATUS_RISKY, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterValidationUntested: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_VALIDATION_UNTESTED, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterValidationPassed: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_VALIDATION_PASSED, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterValidationFailed: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_VALIDATION_FAILED, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterCriteriaCopy: null,
  effortSpecifiedCopy: null,
  recentlyUpdatedCopy: null,
  
  backupAttributeFilterCriteria: function() {
    this.attributeFilterCriteriaCopy = this.attributeFilterCriteria.slice(0);
    this.effortSpecifiedCopy = this.effortSpecified;
    this.recentlyUpdatedCopy = this.recentlyUpdated;
  },
  
  restoreAttributeFilterCriteria: function() {
    this.set('attributeFilterCriteria', this.attributeFilterCriteriaCopy);
    this.set('effortSpecified', this.effortSpecifiedCopy);
    this.set('recentlyUpdated', this.recentlyUpdatedCopy);
  },
  
  attributeFilterEnabled: function() {
    return this.attributeFilterCriteria.length !== 13 || this.effortSpecified !== Tasks.FILTER_DONTCARE ||  this.recentlyUpdated !== Tasks.FILTER_DONTCARE?
    true : false;
  }.property('attributeFilterCriteria', 'effortSpecified', 'recentlyUpdated').cacheable(),
  
  hasFiltering: function() {
    return this.userSelection || this.searchFilter || this.attributeFilterCriteria.length !== 13;
  },
  
  setAttributeFilterShowstoppers: function() {
    this.set('attributeFilterCriteria', Tasks.attributeFilterShowstoppers.slice(0));
  },

  setAttributeFilterTroubled: function() {
    this.set('attributeFilterCriteria', Tasks.attributeFilterTroubled.slice(0));
  },

  setAttributeFilterUnfinished: function() {
    this.set('attributeFilterCriteria', Tasks.attributeFilterUnfinished.slice(0));
  },

  setAttributeFilterUnvalidated: function() {
    this.set('attributeFilterCriteria', Tasks.attributeFilterUnvalidated.slice(0));
  },

  setAttributeFilterCompleted: function() {
    this.set('attributeFilterCriteria', Tasks.attributeFilterCompleted.slice(0));
  },

  clearAttributeFilter: function() {
    this.set('attributeFilterCriteria', Tasks.attributeFilterNone.slice(0));
    this.set('effortSpecified', Tasks.FILTER_DONTCARE);
    this.set('recentlyUpdated', Tasks.FILTER_DONTCARE);
  },

  resetFilters: function() {
    this.set('userSelection', null);
    this.set('searchFilter', null);
    this.clearAttributeFilter();
  },
  
  
  // count: 0, // used for tracking/tuning calls to redraw tasks pane below
  showAssignments: function() { // show tasks for selected user that matches search filter
    
    // Force tasks list indexes to be recomputed so that different height group/regular items redraw correctly
    var tasksList = Tasks.mainPage.getPath('mainPane.tasksList');
    var indexes = SC.IndexSet.create(0, tasksList.get('length'));
    tasksList.rowHeightDidChangeForIndexes(indexes);
   
    // console.log('DEBUG: showAssignments(' + this.count + ') entry at: ' + new Date().format('hh:mm:ss a'));
    // Preserve selected tasks to be restored at the end of redrawing assignments
    var selection = Tasks.tasksController.get('selection');
    var idPattern = null, searchPattern = null, positiveMatch = true;
    var searchFilter = this.get('searchFilter');
    
    // Extract selected users (assignees or <submitters>)
    var i, j, assigneeSelectionDisplayNames = [], submitterSelectionDisplayNames = [];
    if (searchFilter && searchFilter !== '') { // if a search filter is specified
      var assigneeSelection = searchFilter.match(/\[.*\]/);
      if (assigneeSelection) { // if assignee selection is specified
        assigneeSelection += ''; // convert to string
        searchFilter = searchFilter.replace(assigneeSelection, ''); // remove assignee selection from search filter
        assigneeSelection = assigneeSelection.substr(1,assigneeSelection.length-2);
        var assigneeSelectionNames = assigneeSelection.replace(/,/g, ' ').replace(/\s+/g, ' ').replace(/^\s+/, '').replace(/\s+$/, '');
        if (assigneeSelection !== '') {
          assigneeSelectionNames = assigneeSelectionNames.split(' ');
          for (i = 0; i < assigneeSelectionNames.length; i++) {
            var assigneeSelectionName = assigneeSelectionNames[i];
            if(assigneeSelectionName.toLowerCase() === CoreTasks.USER_NONE) {
              assigneeSelectionDisplayNames.push(CoreTasks.USER_UNASSIGNED);
            }
            else {
              var selectedAssigneeUsers = CoreTasks.getUsers(assigneeSelectionName);
              if (selectedAssigneeUsers.length > 0) {
                for (j = 0; j < selectedAssigneeUsers.length; j++) {
                  assigneeSelectionDisplayNames.push(selectedAssigneeUsers[j].get('displayName'));
                }
              }
            }
            // console.log('DEBUG: assignees: ' + assigneeSelectionDisplayNames);
          }
        }
      }
      var submitterSelection = searchFilter.match(/\<.*\>/);
      if (submitterSelection) { // if submitter selection is specified
        submitterSelection += ''; // convert to string
        searchFilter = searchFilter.replace(submitterSelection, ''); // remove submitter selection from search filter
        submitterSelection = submitterSelection.substr(1,submitterSelection.length-2);
        var submitterSelectionNames = submitterSelection.replace(/,/g, ' ').replace(/\s+/g, ' ').replace(/^\s+/, '').replace(/\s+$/, '');
        if (submitterSelection !== '') {
          submitterSelectionNames = submitterSelectionNames.split(' ');
          for (i = 0; i < submitterSelectionNames.length; i++) {
            var submitterSelectionName = submitterSelectionNames[i];
            if(submitterSelectionName.toLowerCase() === CoreTasks.USER_NONE) {
              submitterSelectionDisplayNames.push(CoreTasks.USER_UNASSIGNED);
            }
            else {
              var selectedSubmitterUsers = CoreTasks.getUsers(submitterSelectionName);
              if (selectedSubmitterUsers.length > 0) {
                for (j = 0; j < selectedSubmitterUsers.length; j++) {
                  submitterSelectionDisplayNames.push(selectedSubmitterUsers[j].get('displayName'));
                }
              }
            }
          }
          // console.log('DEBUG: submitters: ' + submitterSelectionDisplayNames);
        }
      }
    
      // Extract task name search filter
      searchFilter = this._escapeMetacharacters(searchFilter).replace(/^\s+/, '').replace(/\s+$/, '');
      // console.log('DEBUG: searchFilter: ' + searchFilter);
      var idMatches = searchFilter.match(/#([\-\d]+)/g);
      // console.log('DEBUG: idMatches = ' + idMatches);
      if(!idMatches) {
        if (searchFilter.indexOf('^') === 0) { // inverse search specified
          positiveMatch = false;
          searchFilter = searchFilter.slice(1);
        }
        searchPattern = new RegExp(searchFilter, 'i');
      }
    }
    
    // Get time left, if any specified, in selected project.
    var projectTimeLeft = null;
    var sel = Tasks.getPath('projectsController.selection');
    if (sel && sel.length() === 1) {
      var project = sel.firstObject();
      if (project) projectTimeLeft = CoreTasks.convertTimeToDays(project.get('countDown'));
    }
      
    // Group tasks by user & separate unassigned tasks
    var assignees = {}, submitter, submitterName, assigneeName, assignee, assignmentNodes = [];
    this.forEach(function(task){
      // console.log("Task Name: " + task.get('name') + "; Id: " + task.get('id'));
      assignee = task.get('assignee');
      submitter = task.get('submitter');
      var taskName = task.get('name');
      var taskDescription = task.get('description');
      var isNewTask = (taskName === CoreTasks.NEW_TASK_NAME.loc()); // Always display "new task"s
      assigneeName = assignee? assignee.get('displayName') : CoreTasks.USER_UNASSIGNED;
      submitterName = submitter? submitter.get('displayName') : CoreTasks.USER_UNASSIGNED;
      if(isNewTask || assigneeSelectionDisplayNames.length === 0 || assigneeSelectionDisplayNames.indexOf(assigneeName) !== -1) {
        
        var assigneeObj = assignees[assigneeName];
        if(!assigneeObj) {
          assigneeObj = { assignee: assignee, tasks: [] };
          assignees[assigneeName] = assigneeObj;
        }
        
        // Filter tasks that meet filter criteria
        if(!isNewTask) {
          
          if(submitterSelectionDisplayNames.length !== 0 && submitterSelectionDisplayNames.indexOf(submitterName) === -1) return;
        
          var type = task.get('type');
          if(this.attributeFilterCriteria.indexOf(type) === -1) return;
          var priority = task.get('priority');
          if(this.attributeFilterCriteria.indexOf(priority) === -1) return;
          var developmentStatus = task.get('developmentStatus');
          if(this.attributeFilterCriteria.indexOf(developmentStatus) === -1) return;
          if(developmentStatus === CoreTasks.STATUS_DONE) {
            var validation = task.get('validation');
            if(this.attributeFilterCriteria.indexOf(validation) === -1) return;
          }
          
          var effortSpecified = this.get('effortSpecified');
          if(effortSpecified !== Tasks.FILTER_DONTCARE) {
            var taskEffortSpecified = !SC.none(task.get('effort'));
            if(effortSpecified === Tasks.FILTER_YES && !taskEffortSpecified) return;
            if(effortSpecified === Tasks.FILTER_NO && taskEffortSpecified) return;
          }
          
          var recentlyUpdated = this.get('recentlyUpdated');
          if(recentlyUpdated !== Tasks.FILTER_DONTCARE) {
            var taskRecentlyUpdated = task.get('isRecentlyUpdated');
            if(recentlyUpdated === Tasks.FILTER_YES && !taskRecentlyUpdated) return;
            if(recentlyUpdated === Tasks.FILTER_NO && taskRecentlyUpdated) return;
          }
          
          if(idMatches) { // one or more exact ID matches of task ID or IDs in name
            var taskId = task.get('displayId');
            if(idMatches.indexOf(taskId) === -1) { // doesn't match task ID exactly
              // see if any task ID entered in the search is a part of the task name
              var taskHasID = false;
              for (var i = 0; !taskHasID && i < idMatches.length; i++) {
                var searchText = taskName + (taskDescription? taskDescription : '');
                var taskIdMatches = searchText.match(/#([\-\d]+)/g);
                if(taskIdMatches) { // task name has IDs in it
                  for (var j=0; j < taskIdMatches.length; j++) {
                    if(taskIdMatches[j] === idMatches[i]) { // found match!
                      taskHasID = true;
                      break;
                    }
                  }
                }
              }
              if(!taskHasID) return;
            }
          }
          else if(searchPattern) { // case insensitive search of task name and/or description
            var nameMatches = taskName.match(searchPattern);
            if(positiveMatch) { // find what matches search pattern
              if(!nameMatches) { // try matching description
                if(!taskDescription || !taskDescription.match(searchPattern)) return;
              }
            }
            else { // inverse search - what doesn't match search pattern
              if(nameMatches) return;
              if(taskDescription && taskDescription.match(searchPattern)) return;
            }
          }
        }
        assigneeObj.tasks.push(task);
      }
    }, this);
  
    for(assigneeName in assignees){
      if(assignees.hasOwnProperty(assigneeName)) {
          this._createAssignmentNode(assignmentNodes, assigneeName, assignees[assigneeName], projectTimeLeft);
      }
    }
      
    // Sort grouped tasks by assignee
    this.set('assignedTasks', SC.Object.create({ treeItemChildren: assignmentNodes.sort(function(a,b) {
      if(!Tasks.assignmentsController._showTasks) { // TEAM display mode, first try to sort in descending order of loading/red flags
        if(a.loading !== CoreTasks.USER_NOT_LOADED && b.loading !== CoreTasks.USER_NOT_LOADED) {
          var loadingDelta = b.effortGapPercent - a.effortGapPercent;
          if(loadingDelta !== 0) return loadingDelta;
          var redFlagsDelta = (b.riskyTasksCount + b.failedTasksCount) - (a.riskyTasksCount + a.failedTasksCount);
          if(redFlagsDelta !== 0) return redFlagsDelta;
        }
        else if(b.loading === CoreTasks.USER_NOT_LOADED && a.loading !== CoreTasks.USER_NOT_LOADED) {
          return -1;
        }
        else if(b.loading !== CoreTasks.USER_NOT_LOADED && a.loading === CoreTasks.USER_NOT_LOADED) {
          return 1;
        }
        else if (a.totalFinishedEffortAve !== 0 || b.totalFinishedEffortAve !== 0) {
          return a.totalFinishedEffortAve - b.totalFinishedEffortAve;
        }
      }
      // Alpha sort by display names
      if (a.displayName === b.displayName) return 0;
      return (a.displayName > b.displayName) ? 1 : -1;
    }), treeItemIsExpanded: YES }));
    
    if(selection) Tasks.tasksController.selectObjects(selection);
    // console.log('DEBUG: showAssignments(' + this.count++ + ') exit  at: ' + new Date().format('hh:mm:ss a'));
    Tasks.assignmentsRedrawNeeded = false;    

  },
  
  _escapeMetacharacters: function(str){
    var metaCharacters = [ '/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\' ];
    var s = new RegExp('(\\' + metaCharacters.join('|\\') + ')', 'g');
    return str? str.replace(s, '\\$1') : '';
  },
  
  /**
   * Create a node in the tree showing a user's tasks.
   *
   * @param {Array} set of assignment nodes.
   * @param {String} assignee name.
   * @param {Object} a hash of assignee ID and tasks array.
   * @param {Number} amount of time left in project.
   * @returns {Object) return a node to be inserted into the tree view.
   */
  _createAssignmentNode: function(assignmentNodes, assigneeName, assigneeObj, projectTimeLeft) {
    
    var taskWithUnspecifiedEffort = false, doneTaskWithUnspecifiedEffort = false;
    var displayName = assigneeName;
    var effortString, totalFinishedEffortMin = 0, totalFinishedEffortMax = 0, totalEffortMin = 0, totalEffortMax = 0, effortMin, effortMax;
    var totalFinishedCount = 0, totalLeftCount = 0;
    var task, tasks = assigneeObj.tasks;
    var tasksCount = tasks.get('length');
    var riskyTasksCount = 0;
    var failedTasksCount = 0;
    if (tasksCount === 0) return; // nothing to do
    
    for (var i = 0; i < tasksCount; i++) {
      
      task = tasks.objectAt(i);
      
      // Extract/total effort for each task (simple number or a range)
      effortString = task.get('effort');
      var priority = task.get('priority');
      var developmentStatus = task.get('developmentStatus');
      var validation = task.get('validation');
      
      if(developmentStatus === CoreTasks.STATUS_DONE && validation !== CoreTasks.TASK_VALIDATION_FAILED) totalFinishedCount++;
      else if (priority !== CoreTasks.TASK_PRIORITY_LOW) totalLeftCount++;
      
      if(developmentStatus === CoreTasks.STATUS_RISKY) riskyTasksCount++;
      if(validation === CoreTasks.TASK_VALIDATION_FAILED) failedTasksCount++;
      
      if(!effortString && priority !== CoreTasks.TASK_PRIORITY_LOW) {
        if(developmentStatus === CoreTasks.STATUS_DONE) doneTaskWithUnspecifiedEffort = true;
        else taskWithUnspecifiedEffort = true;
      }
      if(effortString) { // sum up task effort
        var timeUnit = CoreTasks.getTimeUnit(effortString);
        effortMin = parseFloat(parseFloat(effortString, 10).toFixed(3));
        effortMin = CoreTasks.convertTimeToDays(effortMin + timeUnit);
        var idx = effortString.indexOf('-'); // see if effort is a range
        if(idx === -1) { // not a range
          effortMax = effortMin;
        }
        else { // effort IS a range, extract max
          effortMax = parseFloat(parseFloat(effortString.slice(idx+1), 10).toFixed(3));
          effortMax = CoreTasks.convertTimeToDays(effortMax + timeUnit);
        }
        if(developmentStatus === CoreTasks.STATUS_DONE && validation !== CoreTasks.TASK_VALIDATION_FAILED) {
          totalFinishedEffortMin = parseFloat((totalFinishedEffortMin + effortMin).toFixed(3));
          totalFinishedEffortMax = parseFloat((totalFinishedEffortMax + effortMax).toFixed(3));
        }
        else if (priority !== CoreTasks.TASK_PRIORITY_LOW) { // leave out Low priority items in totals
          totalEffortMin = parseFloat((totalEffortMin + effortMin).toFixed(3));
          totalEffortMax = parseFloat((totalEffortMax + effortMax).toFixed(3));
        }
      }
    }
  
    var finishedEffort = '';
    if(totalFinishedCount) finishedEffort += (totalFinishedCount + "_finished".loc());
    var totalFinishedEffortAve = 0;
    if(totalFinishedEffortMin !== 0) {
      totalFinishedEffortAve = (totalFinishedEffortMin + totalFinishedEffortMax)/2;
      var totalFinishedEffort = '' + parseFloat(totalFinishedEffortMin.toFixed(1));
      if (totalFinishedEffortMax !== totalFinishedEffortMin) {
        totalFinishedEffort += '-' + parseFloat(totalFinishedEffortMax.toFixed(1));
      }
      finishedEffort += ("_total".loc() + CoreTasks.displayTime(totalFinishedEffort) + (doneTaskWithUnspecifiedEffort? '?' : ''));
    }
    
    var loading = CoreTasks.USER_NOT_LOADED;
    var displayEffort = '';
    if(totalLeftCount) displayEffort += (totalLeftCount + "_left".loc());
    var effortGap = 0, effortGapPercent = 0;
    if(totalEffortMin !== 0) {
      if(projectTimeLeft) { // flag user loading
        var totalEffortAve = (totalEffortMin + totalEffortMax)/2;
        effortGap = totalEffortAve - projectTimeLeft;
        effortGapPercent = 100*effortGap/projectTimeLeft;
        if(effortGap < 1 && effortGapPercent < -15) loading = CoreTasks.USER_UNDER_LOADED;
        else if(effortGap > 1 && effortGapPercent > 15) loading = CoreTasks.USER_OVER_LOADED;
        else loading = CoreTasks.USER_PROPERLY_LOADED;
      }
      var totalEffort = '' + parseFloat(totalEffortMin.toFixed(1));
      if (totalEffortMax !== totalEffortMin) {
        totalEffort += '-' + parseFloat(totalEffortMax.toFixed(1));
      }
      displayEffort += ("_total".loc() + CoreTasks.displayTime(totalEffort) + (taskWithUnspecifiedEffort? '?' : ''));
    }
    else if(taskWithUnspecifiedEffort && totalLeftCount && projectTimeLeft) { // have tasks but don't have any estimates
      displayEffort += "_total".loc() + '?';
    }
    
    assignmentNodes.push (SC.Object.create({
      displayName: displayName,
      tasksCount: tasksCount,
      finishedTasksCount: totalFinishedCount,
      finishedEffort: finishedEffort,
      totalFinishedEffortAve: totalFinishedEffortAve,
      leftTasksCount: totalLeftCount,
      displayEffort: displayEffort,
      effortGapPercent: effortGapPercent,
      riskyTasksCount:  riskyTasksCount,
      failedTasksCount:  failedTasksCount,
      loading: loading,
      assignee: assigneeObj.assignee,
      treeItemChildren: Tasks.assignmentsController._showTasks? tasks.sort(function(a,b) {
        // sort by status, then by validation (if "Done"), then by priority, then by type
        
        var aStatus = a.get('developmentStatus');
        var bStatus = b.get('developmentStatus');
        if(aStatus !== bStatus) return CoreTasks.taskStatusWeights[bStatus] - CoreTasks.taskStatusWeights[aStatus];
        
        if(aStatus === CoreTasks.STATUS_DONE) {
          var aValidation = a.get('validation');
          var bValidation = b.get('validation');
          if(aValidation !== bValidation) return CoreTasks.taskValidationWeights[bValidation] - CoreTasks.taskValidationWeights[aValidation];
        }
        
        var aPriority = a.get('priority');
        var bPriority = b.get('priority');
        if(aPriority !== bPriority) return CoreTasks.taskPriorityWeights[bPriority] - CoreTasks.taskPriorityWeights[aPriority];
        
        var aType = a.get('type');
        var bType = b.get('type');
        if(aType !== bType) return CoreTasks.taskTypeWeights[bType] - CoreTasks.taskTypeWeights[aType];
        
        // var aID = a.get('id');
        // var bID = b.get('id');
        // if(aID < 0 && bID < 0) return bID - aID;
        // else if(aID < 0) return 1;
        // else if(bID < 0) return -1;
        // else return aID - bID;
        
        // Finally alpha sort by names, or optionally numerically if task name starts with a number
        var aName = a.get('name');
        var bName = b.get('name');
        if (aName === bName) return 0;
        else {
          var aIndexMatches = /^(\d+\.\d+|\d+)/.exec(aName);
          if(aIndexMatches) {
            var bIndexMatches = /^(\d+\.\d+|\d+)/.exec(bName);
            if(bIndexMatches) {
              return parseFloat(aIndexMatches[1]) - parseFloat(bIndexMatches[1]);
            }
          }
          return (aName > bName) ? 1 : -1;
        }
        
      }) : null,
      treeItemIsExpanded: true
    }));
  },
  
  _timer: null,
  
  _contentHasChanged: function() {
    var content = this.get('content');
    // if (content) console.log('DEBUG: editorPoppedUp=' + Tasks.editorPoppedUp + ', tasks: ' + content.getEach('name'));
    Tasks.assignmentsRedrawNeeded = true;    
    if(Tasks.editorPoppedUp === Tasks.TASK_EDITOR) return;
  	if (this._timer) { // called as a result of a timer set for assignee selection or search filter changes
      this._timer.invalidate();
      this._timer = null;
    }
  	this.invokeOnce(this.showAssignments);
  }.observes('[]', '_showTasks'),
  
  _searchFilterHasChanged: function() {
    // console.log('DEBUG: Search filter changed to "' + this.searchFilter + '"');
    // Allow typing delay over a half second before redrawing tasks pane
    if (this._timer) this._timer.invalidate();
    this._timer = this.invokeLater(this._contentHasChanged, 500);
  }.observes('searchFilter'),
  
  assignmentsSummary: function() {
    
    var ret = '';
    
    var assigneesCount = 0;
    var assignmentNodes = this.getPath('assignedTasks.treeItemChildren');
    if(assignmentNodes) assigneesCount = assignmentNodes.get('length');
    ret += (assigneesCount + "_assignees".loc());

    var tasksCount = 0;
    var redFlags = 0;
    for(var i=0; i < assigneesCount; i++) {
      var assignmentNode = assignmentNodes.objectAt(i);
      tasksCount += assignmentNode.get('tasksCount');
      var riskyTasksCount = assignmentNode.get('riskyTasksCount');
      var failedTasksCount = assignmentNode.get('failedTasksCount');
      if(riskyTasksCount > 0 || failedTasksCount > 0) redFlags++;
    }
    if(this.get('displayMode') === Tasks.DISPLAY_MODE_TASKS) {
      ret += tasksCount + "_tasks".loc();
    }
    else { // this.displayMode === Tasks.DISPLAY_MODE_TEAM
      ret += redFlags + "_redFlags".loc();
    }
    
    return ret;

  }.property('assignedTasks'),
  
  statistics: '',
  
  computeStatistics: function() {

    var submitters = {};
    var notLoadedAssigneesCount = 0, underloadedAssigneesCount = 0,
        properlyLoadedAssigneesCount = 0, overloadedAssigneesCount = 0;
    var finishedTasksCount = 0, leftTasksCount = 0;
    var riskyTasksCount = 0, failedTasksCount = 0;
    var featureCount = 0, bugCount = 0, otherCount = 0;
    var highCount = 0, mediumCount = 0, lowCount = 0;
    var plannedCount = 0, activeCount = 0, doneCount = 0, riskyCount = 0;
    var untestedCount = 0, passedCount = 0, failedCount = 0;
    
    var assigneesCount = 0;
    var assignmentNodes = this.getPath('assignedTasks.treeItemChildren');
    if(assignmentNodes) assigneesCount = assignmentNodes.get('length');
    var tasksCount, totalTasksCount = 0;
    for(var i=0; i < assigneesCount; i++) {
      var assignmentNode = assignmentNodes.objectAt(i);
      finishedTasksCount += assignmentNode.get('finishedTasksCount');
      leftTasksCount += assignmentNode.get('leftTasksCount');
      var loading = assignmentNode.get('loading');
      switch(loading) {
        case CoreTasks.USER_NOT_LOADED: notLoadedAssigneesCount++; break;
        case CoreTasks.USER_UNDER_LOADED: underloadedAssigneesCount++; break;
        case CoreTasks.USER_PROPERLY_LOADED: properlyLoadedAssigneesCount++; break;
        case CoreTasks.USER_OVER_LOADED: overloadedAssigneesCount++; break;
      }
      riskyTasksCount += assignmentNode.get('riskyTasksCount');
      failedTasksCount += assignmentNode.get('failedTasksCount');
      tasksCount = assignmentNode.get('tasksCount');
      totalTasksCount += tasksCount;
      var tasks = assignmentNode.get('treeItemChildren');
      for(var j=0; tasks && j<tasksCount; j++) {
        var task = tasks.objectAt(j);
        var submitter = task.get('submitter');
        if(submitter) {
          var submitterName = submitter.get('loginName');
          if(submitters[submitterName]) submitters[submitterName]++;
          else submitters[submitterName] = 1;
        }
        
        switch(task.get('type')) {
          case CoreTasks.TASK_TYPE_FEATURE: featureCount++; break;
          case CoreTasks.TASK_TYPE_BUG: bugCount++; break;
          case CoreTasks.TASK_TYPE_OTHER: otherCount++; break;
        }
        switch(task.get('priority')) {
          case CoreTasks.TASK_PRIORITY_HIGH: highCount++; break;
          case CoreTasks.TASK_PRIORITY_MEDIUM: mediumCount++; break;
          case CoreTasks.TASK_PRIORITY_LOW: lowCount++; break;
        }
        switch(task.get('developmentStatus')) {
          case CoreTasks.STATUS_PLANNED: plannedCount++; break;
          case CoreTasks.STATUS_ACTIVE: activeCount++; break;
          case CoreTasks.STATUS_DONE: doneCount++; break;
          case CoreTasks.STATUS_RISKY: riskyCount++; break;
        }
        switch(task.get('validation')) {
          case CoreTasks.TASK_VALIDATION_UNTESTED: untestedCount++; break;
          case CoreTasks.TASK_VALIDATION_PASSED: passedCount++; break;
          case CoreTasks.TASK_VALIDATION_FAILED: failedCount++; break;
        }
      }
    }
    var submittersCount = 0;
    for(var s in submitters) {
      submittersCount++;
    }

    return {
      submittersCount: submittersCount,
      finishedTasksCount: finishedTasksCount, leftTasksCount: leftTasksCount,
      notLoadedAssigneesCount: notLoadedAssigneesCount,
      underloadedAssigneesCount: underloadedAssigneesCount,
      properlyLoadedAssigneesCount: properlyLoadedAssigneesCount,
      overloadedAssigneesCount: overloadedAssigneesCount,
      riskyTasksCount: riskyTasksCount, failedTasksCount: failedTasksCount, tasksCount: totalTasksCount,
      featureCount: featureCount, bugCount: bugCount, otherCount: otherCount,
      highCount: highCount, mediumCount: mediumCount, lowCount: lowCount,
      plannedCount: plannedCount, activeCount: activeCount, doneCount: doneCount, riskyCount: riskyCount,
      untestedCount: untestedCount, passedCount: passedCount, failedCount: failedCount
    };
  
  },
  
  displayStatistics: function() {
    var stats = this.computeStatistics();
    var ret = '';
    if(stats.tasksCount > 0) {
      if(this.get('displayMode') === Tasks.DISPLAY_MODE_TASKS) {
        var blank = sc_static('blank');
        ret += '<table width="100%">';
        if(Tasks.softwareMode) {
          ret += '<tr class="even">';
          ret += ('<td><span>' + "_Type".loc() + '</td>');
          ret += ('<td><img src="' + blank + '" class="task-icon-feature"/>&nbsp;' + "_Feature".loc() + ': ' + stats.featureCount + ' (' + Math.round(100*stats.featureCount/stats.tasksCount) + '%)' + '</td>');
          ret += ('<td><img src="' + blank + '" class="task-icon-bug"/>&nbsp;' + "_Bug".loc() + ': ' + stats.bugCount + ' (' + Math.round(100*stats.bugCount/stats.tasksCount) + '%)' + '</td>');
          ret += ('<td><img src="' + blank + '" class="task-icon-other"/>&nbsp;'  + "_Other".loc() + ': ' + stats.otherCount + ' (' + Math.round(100*stats.otherCount/stats.tasksCount) + '%)' + '</td>');
          ret += '<td></td></tr>';
        }
        ret += '<tr class="odd">';
        ret += ('<td><span>' + "_Priority".loc() + '</td>');
        ret += ('<td><span class="task-priority-high">' + "_High".loc() + ':</span> ' + stats.highCount + ' (' + Math.round(100*stats.highCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="task-priority-medium">' + "_Medium".loc() + ':</span> ' + stats.mediumCount + ' (' + Math.round(100*stats.mediumCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="task-priority-low">' + "_Low".loc() + ':</span> ' + stats.lowCount + ' (' + Math.round(100*stats.lowCount/stats.tasksCount) + '%)' + '</td>');
        ret += '<td></td></tr>';
        ret += '<tr class="even">';
        ret += ('<td><span>' + "_Status".loc() + '</td>');
        ret += ('<td><span class="status-planned">' + "_Planned".loc() + ':</span> ' + stats.plannedCount + ' (' + Math.round(100*stats.plannedCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="status-active">' + "_Active".loc() + ':</span> ' + stats.activeCount + ' (' + Math.round(100*stats.activeCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="status-done">' + "_Done".loc() + ':</span> ' + stats.doneCount + ' (' + Math.round(100*stats.doneCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="status-risky">' + "_Risky".loc() + ':</span> ' + stats.riskyCount + ' (' + Math.round(100*stats.riskyCount/stats.tasksCount) + '%)' + '</td>');
        ret += '</tr>';
        if(Tasks.softwareMode) {
          ret += '<tr class="odd">';
          ret += ('<td><span>' + "_Validation".loc() + '</td>');
          ret += ('<td><span class="task-validation-untested">' + "_Untested".loc() + ':</span> ' + stats.untestedCount + ' (' + Math.round(100*stats.untestedCount/stats.tasksCount) + '%)' + '</td>');
          ret += ('<td><span class="task-validation-passed">' + "_Passed".loc() + ':</span> ' + stats.passedCount + ' (' + Math.round(100*stats.passedCount/stats.tasksCount) + '%)' + '</td>');
          ret += ('<td><span class="task-validation-failed">' + "_Failed".loc() + ':</span> ' + stats.failedCount + ' (' + Math.round(100*stats.failedCount/stats.tasksCount) + '%)' + '</td>');
          ret += '<td></td></tr>';
        }
        ret += '</table><br>';
        ret += "_Submitters:".loc() + stats.submittersCount;
      }
      else { // displayMode === Tasks.DISPLAY_MODE_TEAM
        ret += '<hr>' + "_Assignees:".loc() + stats.overloadedAssigneesCount + ' ' + "_AssigneeOverloaded".loc() + ', ' +
                                              stats.properlyLoadedAssigneesCount + ' ' + "_AssigneeProperlyLoaded".loc() + ', ' +
                                              stats.underloadedAssigneesCount + ' ' + "_AssigneeUnderLoaded".loc() + ', ' +
                                              stats.notLoadedAssigneesCount + ' ' + "_AssigneeNotLoaded".loc();
        ret += '<hr>' + "_RedFlags:".loc() + stats.riskyTasksCount + ' ' + "_Risky".loc() + ', ' +
                                             stats.failedTasksCount + ' ' + "_Failed".loc();
        ret += '<hr>' + "_Summary:".loc() + stats.finishedTasksCount + ' ' + "_finished".loc() + ', ' +
                                            stats.leftTasksCount + ' ' + "_left".loc();
        ret += '<hr>';
      }
    }
    this.set('statistics', ret);
  },
  
  showStatistics: function() {
    this.displayStatistics();
    // HACK: [SG] Creating/destroying panel so that text label refreshes, which is wasn't on quilmes
    this._panel = Tasks.getPath('statisticsPane').create();
    if(this._panel) this._panel.append();
  },
  
  closePanel: function() {
    if(this._panel) {
      this._panel.destroy();
      this._panel = null;
      this.set('statistics', '');
    }
  }
  
});
