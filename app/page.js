'use client'
import { useState, useRef } from "react"

const MainGrid = ({ gridSize = 45 }) => {
  const isDrag = useRef(false);
  const [selected, setSelected] = useState(new Set());
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [pawnType, setPawnType] = useState(null);
  const [path, setPath] = useState(new Set());
  const [needsHelp, setNeedsHelp] = useState(false);

  const toggleCell = (row, col) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      const key = `${row},${col}`;
      if (newSet.has(key)) { newSet.delete(key); }
      else { newSet.add(key); }
      return newSet;
    });
  }

  const handleMouseDown = (row, col) => {
    isDrag.current = true;
    toggleCell(row, col);
  }

  const handleMouseDrag = (row, col) => {
    if (isDrag.current) {
      setSelected((prev) => {
        const newSet = new Set(prev);
        newSet.add(`${row},${col}`);
        return newSet;
      })
    }
  }

  const handleMouseUp = () => {
    isDrag.current = false;
  }


  const clearGrid = () => {
    setPath(new Set());
    setPawnType(null);
    setTimeout(() => {
      setSelected(new Set());

      setTimeout(() => {
        setStart(null);
        setEnd(null);
      }, 200);
    }, 200);
  };

  const resetGrid = () => {
    setPath(new Set());
    setPawnType(null);
  }

  const handlePawnChange = (value) => {
    setPawnType(value);
  }

  const pawnSelected = (value) => {
    return pawnType === value ? "bg-blue-500 border border-white text-white" : "bg-gray-900 border border-white text-white";
  }

  const handleRightClick = (event, row, col) => {
    event.preventDefault();
    if (start && start.col === col && start.row === row) {
      setStart(null);
    } else if (end && end.row === row && end.col === col) {
      setEnd(null);
      selected.delete(`${row},${col}`)
    } else if (!start) {
      setStart({ row, col })
    } else if (!end) {
      setEnd({ row, col })
    }
  }

  const moves = {
    Rook: [[0, 1], [0, -1], [1, 0], [-1, 0]],
    Bishop: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    Queen: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
    King: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
    Knight: [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]
  }

  const reconstructedPath = (parentMap, start, end) => {
    const path = [];
    let curr = `${end.row},${end.col}`;

    while (curr) {
      path.push(curr);
      curr = parentMap.get(curr);
    }

    return path.reverse();
  }

  const bfs = (start, end, gridSize, moves, selected) => {

    selected.delete(`${start.row},${start.col}`);
    selected.delete(`${end.row},${end.col}`);
    const queue = [[start.row, start.col, 0]];
    const visited = new Set();
    const parentPath = new Map();

    visited.add(`${start.row},${start.col}`);

    while (queue.length) {
      const [r, c, s] = queue.shift();

      if (r === end.row && c === end.col) return reconstructedPath(parentPath, start, end);

      for (const [rr, cc] of moves) {
        const newr = r + rr;
        const newc = c + cc;
        const key = `${newr},${newc}`;
        if (newr >= 0 && newr < gridSize) {
          if (newc >= 0 && newc < gridSize) {
            if (!selected.has(key)) {
              if (!visited.has(key)) {
                visited.add(key);
                queue.push([newr, newc, s + 1]);
                parentPath.set(key, `${r},${c}`)
              }
            }
          }
        }
      }
    }
    return null;
  }


  const animatePath = async (path) => {
    for (let i = 0; i < path.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      setPath((prev) => new Set([...prev, path[i]]));
    }
  };

  const findRoute = async () => {

    if (!start) {
      alert("Select start position");
      return;
    }

    if (!end) {
      alert("Select end position");
      return;
    }

    if (!pawnType) {
      alert("select Chess piece");
      return;
    }

    setPath(new Set());
    const path = bfs(start, end, gridSize, moves[pawnType], selected);

    if (!path) {
      alert("No path found!");
    } else {
      await animatePath(path, pawnType);
    }
  };




  return (<div className="flex bg-black flex-row"><div className="flex flex-col gap-20 m-auto w-[25vw]">
    {["Rook", "Bishop", "Queen", "King", "Knight"].map((option, index) => {
      return (
        <label key={index} className={`rounded w-fit mx-auto font-extrabold p-4 flex flex-row text-2xl items-center transition-colors duration-500 hover:scale-105 cursor-pointer ${pawnSelected(option)}`}><input type="radio"
          name="options"
          value={option}
          className="hidden"
          onChange={() => handlePawnChange(option)}
          checked={pawnType === option} />
          {option}
          <img
            src={`/${option.toLowerCase()}.png`}
            alt={option}
            className="ml-3 w-10 h-10" />
        </label>
      )
    })}</div>

    <div
      className="select-none mr-[25vw] my-[2.5vh] border-[2.5vh] drop-shadow-[0_0_5px_rgb(50,50,50,1)] border-black w-fit"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridSize},1fr)`,
        gridTemplateRows: `repeat(${gridSize},1fr)`,
      }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {
        Array.from({ length: gridSize * gridSize }, (_, index) => {
          const row = Math.floor(index / gridSize);
          const col = index % gridSize;
          const key = `${row},${col}`;
          const isStart = start && start.row === row && start.col === col;
          const isEnd = end && end.row === row && end.col === col;
          const isPath = path.has(key);
          const isSelected = selected.has(key);
          const cclass = isStart ? "bg-[rgb(46,10,152)] drop-shadow-[0_0_10px_rgb(40,15,52,1)]"
            : isEnd ? "bg-[rgb(20,7,83)] drop-shadow-[0_0_10px_rgb(0,0,0,1)]"
              : isPath ? "bg-[rgb(15,201,122)] drop-shadow-[0_0_10px_rgb(27,140,92,1)]"
                : isSelected ? "bg-black drop-shadow-[0_0_10px_rgb(0,0,0,0.5)]"
                  : "bg-white";
          return (
            <div key={key}
              className={`w-[calc(90vh/45)] h-[calc(90vh/45)] border border-gray-500 transition-colors ${cclass}`}
              onMouseDown={() => handleMouseDown(row, col)}
              onMouseOver={() => handleMouseDrag(row, col)}
              onContextMenu={(e) => handleRightClick(e, row, col)} />
          )
        })
      }
    </div><div className="absolute right-0 w-[25vw] z-10 text-2xl font-extrabold items-center h-[100vh]">
      <div className="mt-20 text-7xl font-extrabold text-center mb-20"><h1 className="">Chesser</h1><a href="https://github.com"><img className="h-10 w-10 mt-10 filter invert ml-[80%]" src="/github.png" /></a></div>
      <div className="gap-20 flex my-auto justify-center flex-col items-center">
        <button className="w-fit p-3 rounded-md text-white bg-gray-700 border flex flex-row items-center hover:scale-105 border-white" onClick={findRoute}>Begin!<img className="ml-4 h-[2rem]" src="/play.png" alt="play button" /></button>
        <button className="w-fit p-3 rounded-md text-white bg-gray-700 border flex flex-row items-center hover:scale-105 border-white" onClick={() => setNeedsHelp(true)}>Help/About<img className="ml-4 filter invert h-[2rem]" src="/help.png" alt="play button" /></button>
        <button className="w-fit p-3 rounded-md text-white bg-gray-700 border flex flex-row items-center hover:scale-105 border-white" onClick={resetGrid}>Reset<img className="ml-4 filter brightness-[300%] h-[2.5rem]" src="/refresh.png" alt="reset button" /></button>
        <button className="w-fit p-3 rounded-md text-white bg-gray-700 border flex flex-row items-center hover:scale-105 border-white" onClick={clearGrid}>Clear<img className="ml-4 filter brightness-150 h-[2.5rem]" src="/cancel.png" alt="clear button" /></button></div>
    </div>
    {needsHelp && (
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20" onClick={() => setNeedsHelp(false)}>
        <div className="bg-white relative overflow-y-auto h-[80vh] z-100 text-black p-10 rounded-lg shadow-lg w-[30vw] text-left" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-xl font-bold mb-2">About</h2>
          <p>This is a project that uses bfs algorithm to find the shortest path required by each chess piece to traverse from the start position to the end</p>
          <br />
          <h2 className="text-xl font-bold mb-2">Help</h2>
          <p>1. Right click in the grid once to set the start position and again to set the end position. Right click them again to deselect the same.</p>
          <img src="/help1.png" className="w-30 mt-5 h-30" alt="img" />
          <br />
          <p>2. Left click or drag on the grid to draw walls. These walls will block the chess pieces' moves. Click on them again to deselect them.</p>
          <img src="/help2.png" className="w-30 mt-5 h-30" alt="img" />
          <br />
          <p>3. Click on begin to create the path for the respective selected chess piece!</p>
          <img src="/help3.png" className="w-30 mt-5 h-30" alt="img" />
          <br />
          <p>4. Click on clear to clear the grid comepletely.</p>
          <br />
          <p>5. Click on reset to clear just the path from the grid to make changes in the grid.</p>
          <button
            onClick={() => setNeedsHelp(false)}
            className="text-gray-700 p-1 absolute border rounded-full border-gray-700 top-5 right-5"
          >
            X
          </button>
        </div>
      </div>
    )
    }</div>

  )
}

export default MainGrid;
