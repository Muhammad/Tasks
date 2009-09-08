// ==========================================================================
// Tasks.importData
// ==========================================================================
/*globals Tasks sc_require */
sc_require('core');

/** @static
    
  @extends SC.Page
  @author Suvajit Gupta
  
  Import Data Panel
  
*/
Tasks.loginPage = SC.Page.create({
  
  panel: SC.PanelPane.create({
    
    layout: { centerX: 0, centerY: 0, height: 90, width: 320 },
    
    contentView: SC.View.design({
      layout: { left: 0, right: 0, top: 0, bottom: 0},
      childViews: 'loginPrompt loginEntry loginButton cancelButton'.w(),
      
      loginPrompt: SC.LabelView.design({
        layout: { top: 10, left: 10, width: 75, height: 24 },
        value: "_LoginName:".loc()
      }),
      
      loginEntry: SC.TextFieldView.design({
        layout: { top: 10, left: 95, right: 15, height: 20 },
        valueBinding: 'Tasks.loginController.loginName'
      }),
      
      loginButton: SC.ButtonView.design({
        layout: { width: 80, height: 30, right: 10, bottom: 8 },
        titleMinWidth: 0,
        isEnabledBinding: SC.Binding.oneWay('Tasks.loginController.loginName'),
        theme: 'capsule',
        isDefault: YES,
        title: "_Login".loc(),
        target: 'Tasks.loginController',
        action: 'login'
      }),
      
      cancelButton: SC.ButtonView.design({
        layout: { width: 80, height: 30, right: 96, bottom: 8 },
        titleMinWidth: 0,
        theme: 'capsule',
        isCancel: YES,
        title: "_Cancel".loc(),
        target: 'Tasks.loginController',
        action: 'closePanel'
      })
      
    }),
      
    focus: function() {
      this.contentView.loginEntry.becomeFirstResponder();        
    }
    
  })
  
});