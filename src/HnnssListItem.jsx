/**
 * HNNSS List Item Component Spec
 * 
 * 1. Layout: Flex-row, 120px height
 * 2. Left: 100px * 100px Poster (object-cover, 8px radius)
 * 3. Right: Flex-col, 15px gap from image
 *    - Top: location.name (18px, Bold, #FFF)
 *    - Middle: parties.title (14px, #CCC, truncation)
 *    - Bottom: start_time + address (12px, #888)
 */

export const HnnssListItem = ({ party }) => {
  return (
    <div className="hnnss-card">
      <img 
        src={party.poster_url} 
        alt="" 
        className="hnnss-poster"
        onError={(e) => {
          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3C/svg%3E"
        }}
      />
      <div className="hnnss-content">
        <h2 className="hnnss-location">{party.location_name}</h2>
        <p className="hnnss-title">{party.title}</p>
        <p className="hnnss-footer">
          {party.start_time}  {party.address}
        </p>
      </div>
    </div>
  );
};

export default HnnssListItem;
