function getMacro(query, normalisedURL=null) {
  const macros = window.CONFIG?.macros ?? []
  // searching for a macro by url
  if (normalisedURL) {
    for (const macro of macros) {
      if (normalisedURL === macro.normalisedURL) {
        return {options: macro, command: null}
      }
    }
  } else {
    // searching for a macro by triggers
    for (const macro of macros) {
      for (const trigger of macro.triggers) {
        if (query === trigger) {
          return {options: macro, command: null}
        } else if (query.startsWith(trigger)) {
          const command = getCommand(query.slice(trigger.length))
          if (typeof macro.commands === 'object' && command) {
            if (Object.prototype.hasOwnProperty.call(macro.commands, command.type))
              return {options: macro, command}
          }
        }
      }
    }
  }

  return null
}

function getCommand(query) {
  let foundCommand = null

  const sortedCommands = [...(window.CONFIG?.commands ?? [])].sort((a, b) => a.trigger.length > b.trigger.length)

  for (const command of sortedCommands)
    // if it's a command
    if (query.startsWith(command.trigger))
      foundCommand = {
        ...command,
        // the rest is arguments
        args: query.slice(command.trigger.length)}

  return foundCommand
}

export default getMacro