import xapi from 'xapi'

async function guiEvent(event) {
  if (event.WidgetId === 'theme' && event.Type === 'released') {
    const theme = event.Value
    try {
      await xapi.Config.UserInterface.Theme.Name.set(theme)
    }
    catch(e) {
      console.warn('Not able to set theme', theme, e)
    }
  }
}

async function markSelected() {
  let current = await xapi.Config.UserInterface.Theme.Name.get()
  if (current === 'Auto') {
    current = 'EveningFjord'
  }
  try {
    await xapi.Command.UserInterface.Extensions.Widget.SetValue({ WidgetId: 'theme', Value: current })
  }
  catch {}
}

xapi.Event.UserInterface.Extensions.Widget.Action.on(guiEvent)
markSelected()