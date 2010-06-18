// ==========================================================================
// Tasks.statisticsPane
// ==========================================================================
/*globals Tasks CoreTasks sc_require */
sc_require('core');


/** @static
    
  @extends SC.PanelPane
  @author Suvajit Gupta
  
  Filter Panel
  
*/

Tasks.statisticsPane = SC.PanelPane.extend({  
  
  layout: { centerX: 0, centerY: 0, height: Tasks.softwareMode? 230 : 200, width: 650 },
  classNames: ['statistics-pane'],
  
  contentView: SC.View.design({
    
    layout: { top: 0, left: 0, bottom: 0, right: 0 },
    childViews: 'titlebar statistics closeButton'.w(),
    
    titlebar: SC.View.design(SC.Border, {
      layout: { left: 0, right: 0, top: 0, height: 45 },
      classNames: ['title-bar'],
      childViews: 'title'.w(),
      title: SC.LabelView.design({
        layout: { centerY: 0, height: 20, centerX: 0, width: 200 },
        value: "_Statistics".loc(),
        icon: 'statistics-icon',
        classNames: ['window-title']
      })
    }),
    
    statistics: SC.LabelView.design({
      layout: { top: 55, left: 10, right: 10, bottom: 10 },
      textAlign: SC.ALIGN_CENTER,
      controlSize: SC.SMALL_CONTROL_SIZE,
      escapeHTML: NO,
      valueBinding: 'Tasks.assignmentsController.statistics'
    }),
    
    closeButton: SC.ButtonView.design({
      layout: { width: 80, height: 30, right: 10, bottom: 8 },
      titleMinWidth: 0,
      keyEquivalent: 'return',
      isDefault: YES,
      theme: 'capsule',
      title: "_Close".loc(),
      target: 'Tasks.assignmentsController',
      action: 'closePanel'
    })
    
  })
      
});