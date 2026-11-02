import { formatPercent } from "../lib/amount";
import { SLIPPAGE_PRESETS } from "../lib/quote";
import { Sheet } from "./Sheet";

interface SettingsSheetProps {
  slippage: number;
  failNext: boolean;
  onSlippage: (value: number) => void;
  onFailNext: (value: boolean) => void;
  onClose: () => void;
}

export function SettingsSheet({
  slippage,
  failNext,
  onSlippage,
  onFailNext,
  onClose,
}: SettingsSheetProps) {
  return (
    <Sheet title="Settings" onClose={onClose}>
      <section className="setting">
        <h3 id="slippage-label">Max slippage</h3>
        <p className="setting__hint">
          If the price moves more than this before your swap goes through, it’s cancelled
          and nothing is spent.
        </p>
        <div className="segmented" role="group" aria-labelledby="slippage-label">
          {SLIPPAGE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={preset === slippage}
              onClick={() => onSlippage(preset)}
            >
              {formatPercent(preset)}
            </button>
          ))}
        </div>
      </section>

      <section className="setting">
        <h3>Demo controls</h3>
        <p className="setting__hint">
          For trying the app. A real wallet would not have this.
        </p>
        <label className="switch">
          <input
            type="checkbox"
            role="switch"
            checked={failNext}
            onChange={(event) => onFailNext(event.target.checked)}
          />
          <span className="switch__track" aria-hidden="true" />
          <span>Make the next swap fail</span>
        </label>
      </section>
    </Sheet>
  );
}
