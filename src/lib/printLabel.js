export function printSampleLabel(sample) {
  const win = window.open("", "_blank", "width=420,height=320")
  if (!win) return

  win.document.write(`
    <html>
      <head>
        <title>Label - ${sample.sample_id}</title>
        <style>
          body { font-family: 'IBM Plex Mono', monospace; padding: 24px; color: #1B2530; }
          .label { border: 2px solid #1B2530; border-radius: 8px; padding: 18px; max-width: 340px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .row span:first-child { color: #3C4A56; }
          .row span:last-child { font-weight: 600; }
          .bloodtype { font-size: 32px; font-weight: 700; color: #C0293B; text-align: center; margin: 10px 0; }
          .sampleid { text-align: center; font-size: 14px; letter-spacing: 1px; margin-bottom: 14px; }
          .brand { text-align: center; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #4A90A4; margin-bottom: 10px; }
          hr { border: none; border-top: 1px dashed #D6DBDD; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="brand">Genolab BloodTrack</div>
          <div class="sampleid">${sample.sample_id}</div>
          <div class="bloodtype">${sample.blood_type}</div>
          <hr />
          <div class="row"><span>Collection Center</span><span>${sample.collection_center}</span></div>
          <div class="row"><span>Date Received</span><span>${sample.date_received}</span></div>
          <div class="row"><span>Expiry Date</span><span>${sample.expiry_date}</span></div>
          <div class="row"><span>Storage Location</span><span>Rack ${sample.rack} - Slot ${sample.slot}</span></div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `)
  win.document.close()
}
