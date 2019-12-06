import React, { useState, useEffect } from "react";
import { connect } from "react-redux";

import { getTimeStr } from "../../utils";
import {
  getVisibleTrackIds,
  getScrollOffset,
  getNumberOfTracks,
  getTracks,
} from "../../selectors";
import { TRACK_HEIGHT } from "../../constants";
import { SELECT_ZERO } from "../../actionTypes";
import { dragSelected, scrollPlaylistByDelta } from "../../actionCreators";
import TrackCell from "./TrackCell";
import TrackTitle from "./TrackTitle";
import { Dispatch, AppState } from "../../types";
import { TracksState } from "../../reducers/tracks";

interface DispatchProps {
  selectZero: () => void;
  scrollPlaylistByDelta: (e: React.WheelEvent<HTMLDivElement>) => void;
  dragSelected: (offset: number) => void;
}

interface StateProps {
  trackIds: number[];
  offset: number;
  numberOfTracks: number;
  tracks: TracksState;
}

function getNumberLength(number: number): number {
  return number.toString().length;
}

function TrackList(props: DispatchProps & StateProps) {
  const [node, setNode] = useState<Element | null>(null);
  const [moving, setMoving] = useState(false);
  const [mouseStartY, setMouseStartY] = useState<number | null>(null);

  const _handleMoveClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setMoving(true);
    setMouseStartY(e.clientY);
  };

  useEffect(() => {
    if (node == null || mouseStartY == null || moving === false) {
      return;
    }
    const { top, bottom, left, right } = node.getBoundingClientRect();
    let lastDiff = 0;
    const handleMouseMove = (ee: MouseEvent) => {
      const { clientY: y, clientX: x } = ee;
      if (y < top || y > bottom || x < left || x > right) {
        // Mouse is outside the track list
        return;
      }
      const proposedDiff = Math.floor((y - mouseStartY) / TRACK_HEIGHT);
      if (proposedDiff !== lastDiff) {
        const diffDiff = proposedDiff - lastDiff;
        props.dragSelected(diffDiff);
        lastDiff = proposedDiff;
      }
    };

    const handleMouseUp = () => setMoving(false);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // I'm not 100% sure how well this would work if it rebound mid drag, so
    // we'll just pretend it's okay that we have stale values in there.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moving]);

  function _renderTracks(
    format: (id: number, i: number) => JSX.Element | string
  ) {
    return props.trackIds.map((id, i) => (
      <TrackCell
        key={id}
        id={id}
        index={props.offset + i}
        handleMoveClick={_handleMoveClick}
      >
        {format(id, i)}
      </TrackCell>
    ));
  }

  const { tracks, offset } = props;
  const maxTrackNumberLength = getNumberLength(props.numberOfTracks);
  const paddedTrackNumForIndex = (i: number) =>
    (i + 1 + offset).toString().padStart(maxTrackNumberLength, "\u00A0");
  return (
    <div
      ref={setNode}
      className="playlist-tracks"
      style={{ height: "100%" }}
      onClick={props.selectZero}
      onWheel={props.scrollPlaylistByDelta}
    >
      <div className="playlist-track-titles">
        {_renderTracks((id, i) => (
          <TrackTitle id={id} paddedTrackNumber={paddedTrackNumForIndex(i)} />
        ))}
      </div>
      <div className="playlist-track-durations">
        {_renderTracks(id => getTimeStr(tracks[id].duration))}
      </div>
    </div>
  );
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  selectZero: () => dispatch({ type: SELECT_ZERO }),
  dragSelected: (offset: number) => dispatch(dragSelected(offset)),
  scrollPlaylistByDelta: (e: React.WheelEvent<HTMLDivElement>) =>
    dispatch(scrollPlaylistByDelta(e)),
});

const mapStateToProps = (state: AppState): StateProps => ({
  offset: getScrollOffset(state),
  trackIds: getVisibleTrackIds(state),
  tracks: getTracks(state),
  numberOfTracks: getNumberOfTracks(state),
});

export default connect(mapStateToProps, mapDispatchToProps)(TrackList);
