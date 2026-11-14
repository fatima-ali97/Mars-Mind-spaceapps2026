"""Download the REAL USGS/NASA MOLA numerical GeoTIFF (about 2 GB).

Only run when you have enough disk space and internet. Streaming to a .part
file prevents an incomplete download from being mistaken for a finished one.
This tool downloads real archived NASA observations; it does not make data up.
"""
import argparse
from pathlib import Path
from urllib.request import Request, urlopen

SOURCE = "https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif"
DEFAULT_DEST = Path(__file__).resolve().parents[1] / "downloads" / "Mars_MGS_MOLA_DEM_mosaic_global_463m.tif"


def download(destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.is_file() and destination.stat().st_size > 100_000_000:
        print(f"Already downloaded: {destination}")
        return
    partial = destination.with_suffix(destination.suffix + ".part")
    # We restart instead of assuming the server supports range requests.
    request = Request(SOURCE, headers={"User-Agent": "MarsMindAI-Hackathon/1.0"})
    try:
        with urlopen(request, timeout=90) as response, partial.open("wb") as target:
            total = int(response.headers.get("Content-Length", "0"))
            size = 0
            last_report = 0
            while chunk := response.read(1024 * 1024):
                target.write(chunk)
                size += len(chunk)
                if size - last_report >= 100 * 1024 * 1024:
                    print(f"Downloaded {size / 1024**2:.0f} MiB" + (f" / {total / 1024**2:.0f} MiB" if total else ""), flush=True)
                    last_report = size
        if size < 100_000_000 or (total and size != total):
            raise RuntimeError(f"Download incomplete or unexpected file size: {size} bytes")
        partial.replace(destination)
        print(f"Real MOLA file saved: {destination}")
    except Exception:
        print("Download did not finish. Partial .part file is not usable.")
        raise


def main() -> None:
    parser = argparse.ArgumentParser(description="Download real MOLA GeoTIFF (~2 GB)")
    parser.add_argument("--accept-large-download", action="store_true", help="Acknowledge ~2 GB transfer")
    parser.add_argument("--output", type=Path, default=DEFAULT_DEST)
    args = parser.parse_args()
    if not args.accept_large_download:
        parser.error("Use --accept-large-download after checking available disk space and internet")
    download(args.output)

if __name__ == "__main__":
    main()
