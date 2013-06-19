

class Pager extends Backbone.View
  id: 'pager'
  constructor: (ctx) ->
    super()

    # Context contains pager
    ctx.pager = this

    # Save context
    @ctx = ctx

    # Create empty stack
    @stack=[]

    # Create button bar and context menu that change with page loads
    @buttonBar = new Backbone.View()
    @contextMenu = new Backbone.View()
    @listenTo this, 'change', =>
      # Swap items out for new page
      @buttonBar.$el.children().detach()
      @buttonBar.$el.append(_.last(@stack).getButtonBar().el)
      console.log @buttonBar.$el.html()
 
      @contextMenu.$el.children().detach()
      @contextMenu.$el.append(_.last(@stack).getContextMenu().el)

  # Adds a page from a constructor
  openPage: (pageClass, args...) ->
    # Create page
    page = new pageClass(@ctx, args...)
    
    # Deactivate current page
    if @stack.length > 0
      _.last(@stack).deactivate()
      _.last(@stack).$el.detach()

    # Activate new page
    @stack.push(page)
    @$el.append(page.el)

    page.create()
    page.activate()

    # Listen to page changes and bubble up
    @listenTo page, 'change', (args...) ->
      @trigger 'change', args...

    # Indicate page change
    @trigger 'change'

  closePage: (replaceWith, args...) ->
    # Prevent closing last page
    if not replaceWith and @stack.length <= 1
      return

    # Destroy current page
    page = _.last(@stack)
    page.deactivate()
    page.destroy()
    page.remove()

    @stack.pop()

    # Open replaceWith
    if replaceWith
      @openPage replaceWith, args...
    else
      page = _.last(@stack)

      @$el.append(page.el)
      page.activate()

    # Indicate page change
    @trigger 'change'

  # Get title of active page
  getTitle: ->
    _.last(@stack).getTitle()

  # Get buttonbar of active page
  getButtonBar: -> 
    return @buttonBar

  # Get context menu of active page
  getContextMenu: ->
    return @contextMenu

  # Determine if has multiple pages
  multiplePages: ->
    @stack.length > 1

  # Flash a message
  flash: (text, style="", delay=4000) ->
    # Create flash message
    msg = $(_.template('''<div class="alert <% if (style) { %>alert-<%=style%><% } %> flash"><%=text%></div>''', { text:text, style:style }))

    # Add to pager
    @$el.prepend(msg)

    # Fade after x seconds
    setTimeout => 
      msg.slideUp(400, => msg.remove())
    , delay

module.exports = Pager