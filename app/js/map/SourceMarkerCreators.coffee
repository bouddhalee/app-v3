

class SourceMarkerCreator 
  # Calls success with { source: source, marker: marker }
  create: (source, success, error) ->


class EColiSourceMarkerCreator extends SourceMarkerCreator
  create: (source, success, error) ->
    
    success {
      source: source
      marker: L.circleMarker source. {

      }
    }

exports.EColi = EColiSourceMarkerCreator