export const Board = ({ height, width }) => {
  const rows = [];

  for (let i = 0; i < height; i++) {
    const cols = [];
    for (let j = 0; j < width; j++) {
      cols.push(
        <div
          hx-vals={`{"x":${j},"y":${i}}`}
          hx-post={`/attack`}
          hx-swap
          class="flex items-center  justify-center w-[40px] h-[40px] cursor-pointer"
          key={`${i}-${j}`}
        >
          🔵
        </div>
      );
    }
    rows.push(
      <div class="flex" key={i}>
        {cols}
      </div>
    );
  }

  return <div class="flex flex-col">{rows}</div>;
};
