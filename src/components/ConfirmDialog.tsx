import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useId,
  type ReactNode,
} from "react";
type Options = {
  title: string;
  message: string;
  confirmLabel?: string;
  notesOption?: boolean;
};
type Choice = { confirmed: boolean; includeNotes: boolean };
const Context = createContext<((options: Options) => Promise<Choice>) | null>(
  null,
);
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<Options | null>(null),
    [includeNotes, setIncludeNotes] = useState(false);
  const resolver = useRef<((choice: Choice) => void) | null>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId(),
    messageId = useId();
  useEffect(() => {
    if (options && !dialog.current?.open) dialog.current?.showModal();
    else if (!options) dialog.current?.close();
  }, [options]);
  const ask = (next: Options) =>
    new Promise<Choice>((resolve) => {
      resolver.current = resolve;
      setIncludeNotes(false);
      setOptions(next);
    });
  const finish = (confirmed: boolean) => {
    resolver.current?.({ confirmed, includeNotes });
    resolver.current = null;
    setOptions(null);
  };
  return (
    <Context.Provider value={ask}>
      {children}
      <dialog
        ref={dialog}
        className="confirm-dialog"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onCancel={(e) => {
          e.preventDefault();
          finish(false);
        }}
      >
        {options && (
          <>
            <h2 id={titleId}>{options.title}</h2>
            <p id={messageId}>{options.message}</p>
            {options.notesOption && (
              <label className="check-label field">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                />
                包含咨询师私人笔记
              </label>
            )}
            <div className="panel-bottom">
              <button
                autoFocus
                className="secondary"
                onClick={() => finish(false)}
              >
                取消
              </button>
              <button className="primary" onClick={() => finish(true)}>
                {options.confirmLabel || "确认"}
              </button>
            </div>
          </>
        )}
      </dialog>
    </Context.Provider>
  );
}
export function useConfirm() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing confirmation provider");
  return value;
}
