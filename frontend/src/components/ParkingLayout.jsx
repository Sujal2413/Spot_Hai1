import { useState, useMemo } from 'react';
import { Zap, ArrowLeft } from 'lucide-react';

// Generate realistic slot data for a floor
function generateFloorSlots(floorNum, totalSlots, availableRatio) {
  const rows = ['A', 'B', 'C', 'D', 'E'];
  const cols = Math.min(Math.ceil(totalSlots / rows.length), 8);
  const slots = [];
  const evPositions = new Set();

  // Randomly assign ~15% of slots as EV
  const totalGridSlots = rows.length * cols;
  const evCount = Math.max(2, Math.floor(totalGridSlots * 0.15));
  while (evPositions.size < evCount) {
    evPositions.add(Math.floor(Math.random() * totalGridSlots));
  }

  let index = 0;
  for (const row of rows) {
    for (let col = 1; col <= cols; col++) {
      const isEv = evPositions.has(index);
      // Determine occupancy status based on availability ratio
      const rand = Math.random();
      const isOccupied = rand > availableRatio;
      
      slots.push({
        id: `F${floorNum}-${row}${col}`,
        row,
        col,
        isEv,
        status: isOccupied ? 'occupied' : 'available',
      });
      index++;
    }
  }
  return { slots, cols };
}

export default function ParkingLayout({ spot, onSlotSelect, selectedSlotId }) {
  const totalFloors = spot?.spot_type === 'multilevel' || spot?.spot_type === 'underground' ? 4
    : spot?.spot_type === 'indoor' ? 2 : 1;
  
  const [activeFloor, setActiveFloor] = useState(1);

  const availableRatio = spot ? spot.available_slots / spot.total_slots : 0.5;
  const slotsPerFloor = spot ? Math.ceil(spot.total_slots / totalFloors) : 30;

  // Memoize floor data so it doesn't regenerate on every render
  const floorData = useMemo(() => {
    const data = {};
    for (let f = 1; f <= totalFloors; f++) {
      data[f] = generateFloorSlots(f, slotsPerFloor, availableRatio);
    }
    return data;
  }, [totalFloors, slotsPerFloor, availableRatio]);

  const currentFloor = floorData[activeFloor];
  if (!currentFloor) return null;

  const handleSlotClick = (slot) => {
    if (slot.status === 'occupied') return;
    onSlotSelect?.(slot);
  };

  return (
    <div className="card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 24px', borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <h3 className="heading-sm" style={{ marginBottom: 4 }}>Select a Slot</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Choose your preferred parking space
          </p>
        </div>
        {/* Floor Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: totalFloors }, (_, i) => i + 1).map(floor => (
            <button
              key={floor}
              onClick={() => setActiveFloor(floor)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: activeFloor === floor
                  ? '1.5px solid var(--primary-accent)'
                  : '1px solid var(--border)',
                background: activeFloor === floor
                  ? 'rgba(255, 204, 0, 0.12)'
                  : 'transparent',
                color: activeFloor === floor
                  ? 'var(--primary-accent)'
                  : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: activeFloor === floor ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Floor {floor}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 20, padding: '14px 24px',
        borderBottom: '1px solid var(--border)', fontSize: '0.78rem',
        color: 'var(--text-muted)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'inline-block' }} />
          Available
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(107,110,138,0.4)', display: 'inline-block' }} />
          Occupied
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--primary-accent)', display: 'inline-block' }} />
          Selected
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={13} color="var(--primary-accent)" />
          EV
        </span>
      </div>

      {/* Parking Grid */}
      <div style={{ padding: '24px', overflow: 'auto' }}>
        {/* Driveway Label */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 12, marginBottom: 20, padding: '10px 0',
          borderBottom: '2px dashed rgba(255,204,0,0.15)',
        }}>
          <ArrowLeft size={14} color="var(--text-muted)" />
          <span style={{
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '3px',
            color: 'var(--text-muted)', textTransform: 'uppercase',
          }}>
            DRIVEWAY
          </span>
        </div>

        {/* Slot Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${currentFloor.cols}, 1fr)`,
          gap: 8,
          maxWidth: 640,
          margin: '0 auto',
        }}>
          {currentFloor.slots.map(slot => {
            const isSelected = selectedSlotId === slot.id;
            const isOccupied = slot.status === 'occupied';

            let bgColor, borderColor, textColor;
            if (isSelected) {
              bgColor = 'var(--primary-accent)';
              borderColor = 'var(--primary-accent)';
              textColor = '#0B0114';
            } else if (isOccupied) {
              bgColor = 'rgba(107,110,138,0.25)';
              borderColor = 'rgba(107,110,138,0.15)';
              textColor = 'rgba(107,110,138,0.5)';
            } else {
              bgColor = 'var(--bg-tertiary)';
              borderColor = 'rgba(255,204,0,0.1)';
              textColor = 'var(--text-secondary)';
            }

            return (
              <button
                key={slot.id}
                onClick={() => handleSlotClick(slot)}
                disabled={isOccupied}
                style={{
                  position: 'relative',
                  padding: '14px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: bgColor,
                  border: `1.5px solid ${borderColor}`,
                  color: textColor,
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: isOccupied ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                  opacity: isOccupied ? 0.5 : 1,
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isSelected ? '0 0 16px rgba(255,204,0,0.3)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!isOccupied && !isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(255,204,0,0.4)';
                    e.currentTarget.style.background = 'rgba(255,204,0,0.08)';
                    e.currentTarget.style.transform = 'scale(1.04)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isOccupied && !isSelected) {
                    e.currentTarget.style.borderColor = borderColor;
                    e.currentTarget.style.background = bgColor;
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {slot.id}
                {slot.isEv && (
                  <Zap
                    size={11}
                    color={isSelected ? '#0B0114' : 'var(--primary-accent)'}
                    fill={isSelected ? '#0B0114' : 'var(--primary-accent)'}
                    style={{
                      display: 'block',
                      margin: '4px auto 0',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Bar — Selected Slot */}
      {selectedSlotId && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          background: 'rgba(255,204,0,0.03)',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
              Selected Slot
            </span>
            <span style={{
              fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-accent)',
            }}>
              {selectedSlotId}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
