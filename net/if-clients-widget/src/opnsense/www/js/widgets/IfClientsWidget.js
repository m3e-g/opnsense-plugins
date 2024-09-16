/*
 * Copyright (C) 2024 Michał Brzeziński
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES,
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

export default class IfClientsWidget extends BaseTableWidget {
    constructor() {
        super();
        this.tickTimeout = 60;
    }

    getGridOptions() {
        return {
            // trigger overflow-y:scroll after 650px height
            sizeToContent: 350,
        }
    }

    getMarkup() {
        let $container = $('<div id="if-clients-container"></div>');
        let $if_clients_table = this.createTable('if-clients-table', {
            headerPosition: 'none'
        });

        $container.append($if_clients_table);
        return $container;
    }

    async onWidgetTick() {
        const arp = await this.ajaxCall('/api/diagnostics/interface/getArp');
        
        let rows = [];
        
        const if_dict = this.parseArp(arp);
        for (let key in if_dict) {
            const row = [
                `<b>${key}</b>`,
                `${if_dict[key].count}`];//,
                //this.generateDetailedView(if_dict[key].clients)
                //];

            /*row.push($(`
                <div class="if-clients-if-name">
                    <b class="interface-descr" onclick="location.href='/interfaces.php'">
                        ${key}
                    </b>
                </div>
            `).prop('outerHTML'));

            row.push($(`
                <div class="if-clients-count">
                    ${if_dict[key].count}
                </div>                        
            `).prop('outerHTML'));*/
            
            row.push(this.generateDetailedView(if_dict[key].clients));

            rows.push(row);
        }

        super.updateTable('if-clients-table', rows);

    }
 
    generateDetailedView(cli_list) {
        const devs = [];
        cli_list.forEach(item => {
            if (item.hostname != ''){
                devs.push(`${item.hostname}`);
            } else if (item.manufacturer != ''){
                devs.push(`<i>${item.manufacturer}</i>`);
            } else {
                devs.push(`<i>${item.mac}</i>`);
            }
        });
        return $(`<div class="if-clients-info-detail">
                    <div>${devs.join('</div><div>')}</div>
                </div>`).prop('outerHTML');
    }
 
    onWidgetResize(elem, width, height) {
        if (width > 450) {
            $('.if-clients-info-detail').parent().show();
        } else {
            $('.if-clients-info-detail').parent().hide();
        }
        
        return super.onWidgetResize(elem, width, height);
    }

    parseArp(arp_list) {
      const if_dict = {};

      arp_list.forEach(item => {
          const intf = item.intf_description;
          if (if_dict[intf]) {
              if (item.permanent === false) { //Skip permanent entries
                  if_dict[intf].count += 1;
                  if_dict[intf].clients.push({'mac': item.mac, /*'ip': item.ip,*/ 'hostname': item.hostname, 'manufacturer': item.manufacturer});
              }
          } else {
              if_dict[intf] = {};
              if (item.permanent === true) {
                if_dict[intf]['count'] = 0;
                if_dict[intf]['clients'] = [];
              } else {
                if_dict[intf]['count'] = 1;
                if_dict[intf]['clients'] = [{'mac': item.mac, /*'ip': item.ip,*/ 'hostname': item.hostname, 'manufacturer': item.manufacturer}];
              }
          }
      });
      return if_dict;
    }

}

