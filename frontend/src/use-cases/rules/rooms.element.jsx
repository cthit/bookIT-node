import ROOMS from "../../common/rooms";

const Rooms = ({ rooms }) => {
  return (
    <div>
      {rooms.map(r => {
        const room = ROOMS.find(e => e.value === r);
        return <div key={r}>{room.text}</div>;
      })}
    </div>
  );
};

export default Rooms;
