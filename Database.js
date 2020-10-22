import SQLite from "react-native-sqlite-storage";
import BaseClass from '../BaseClass'
import WSGeoMessage from './WsClass/WSGeoMessage'
import WSLocation from './WsClass/WSLocation'
import WSTicket from './WsClass/WSTicket'
import moment from "moment";
SQLite.DEBUG(true);
SQLite.enablePromise(true);

export default class Database {
  initDB() {
    let db = SQLite.openDatabase({ name: "GeofencingDB.db", createFromLocation: "~GeofencingDB.db" })

    return new Promise((resolve) => {
      console.log("Plugin integrity check ...");
      SQLite.echoTest()
        .then(() => {
          console.log("Integrity check passed ...");
          console.log("Opening database ...");
          SQLite.openDatabase({ name: "GeofencingDB.db", createFromLocation: "~GeofencingDB.db" })
            .then(DB => {
              db = DB;
              console.log("Database OPEN");
              db.executeSql('SELECT * FROM tblTickets').then(() => {
                console.log("Database is ready ... executing query ...");
              }).catch((error) => {
                console.log("Received error: ", error);
                console.log("Database not yet ready ... populating data");
              });
              resolve(db);
            })
            .catch(error => {
              console.log(error);
            });
        })
        .catch(error => {
          console.log("echoTest failed - plugin not functional");
        });
    });
  };


  closeDatabase(db) {
    if (db) {
      console.log("Closing DB");
      db.close()
        .then(status => {
          console.log("Database CLOSED");
        })
        .catch(error => {
          console.log('database not closed')
        });
    } else {
      console.log("Database was not OPENED");
    }
  };

  listTickets(Id) {
    var date = moment().format('YYYY-MM-DD');
    return new Promise((resolve) => {
      const tickets = [];
      this.initDB().then((db) => {
        db.transaction((tx) => {
          tx.executeSql(`SELECT DISTINCT LocationCode, TicketNo, Status, LocationName, PictureLocation, UserID FROM tblTickets WHERE UserID = ${Id} AND Date = '${date}T00:00:00.000Z' ORDER BY Status DESC`, []).then(([tx, results]) => {
            console.log("Query completed");
            var len = results.rows.length;
            //console.log(" tickets len ..",len);
            for (let i = 0; i < len; i++) {
              let row = results.rows.item(i);
              console.log(`LocationCode: ${row.LocationCode}, TicketNo: ${row.TicketNo}`)
              const { LocationCode, TicketNo, Status, LocationName, PictureLocation, UserID } = row;
              tickets.push({
                LocationCode,
                TicketNo,
                Status,
                LocationName,
                PictureLocation,
                UserID
              });
            }
            //console.log("list tickets..",tickets);
            resolve(tickets);
            // this.closeDatabase(db);
          });
        }).then((result) => {
          this.closeDatabase(db);
        }).catch((err) => {
          console.log(err);
          this.closeDatabase(db);
        });
      }).catch((err) => {
        console.log(err);
        this.closeDatabase(db);
      });
    });
  }

  addTicketsList(data) {
    return new Promise((resolve) => {
      this.initDB()
        .then((db) => {
          db.transaction((tx) => {
            var objTicket = data
            var len = objTicket.length
            console.log("Length:-" + len)
            for (let i = 0; i < data.length; i++) {
              let row = data[i];
              this.addTicket(row)
            }
          }).then((result) => {
            this.closeDatabase(db);
          }).catch((err) => {
            console.log(err);
          });
        }).catch((err) => {
          console.log(err);
        });
    })

  }

  selectTickets(ticket) {
    var date = moment().format('YYYY-MM-DD');
    var ticketNo = String();
    ticketNo = ticket.TicketNo
    var TicketNo = ticketNo.trim()
    var locationCode = String();
    locationCode = ticket.LocationCode
    var LocationCode = locationCode.trim()
    //console.log('ticket:==='+JSON.stringify(ticket))
    return new Promise((resolve) => {
      this.initDB().then((db) => {
        db.transaction((tx) => {
          tx.executeSql(`SELECT * FROM tblTickets WHERE LocationCode = '${LocationCode}' AND TicketNo = '${TicketNo}' AND UserID = ${ticket.UserID} AND Date = '${ticket.Date}'`).then(([tx, results]) => {
            resolve(results)
          })
        }).then((result) => {
          this.closeDatabase(db);
        }).catch((err) => {
          console.log(err);
        });
      }).catch((err) => {
        console.log(err);
      });
    });

  }

  addTicket(ticket) {
    var ticketNo = String();
    ticketNo = ticket.TicketNo
    var TicketNo = ticketNo.trim()
    var locationCode = String();
    locationCode = ticket.LocationCode
    var LocationCode = locationCode.trim()
    //console.log('ticket:==='+JSON.stringify(ticket))
    return new Promise((resolve) => {
      this.initDB().then((db) => {
        db.transaction((tx) => {
          tx.executeSql(`SELECT * FROM tblTickets WHERE LocationCode = '${LocationCode}' AND TicketNo = '${TicketNo}' AND Date = '${ticket.Date}'`).then(([tx, results]) => {
            resolve(results)
            console.log('selectResult:===' + JSON.stringify(results));
            if (results.rows.length === 0) {
              db.transaction((tx) => {
                console.log("data for insert" + JSON.stringify(ticket))
                tx.executeSql('INSERT INTO tblTickets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [ticket.IDTickets, TicketNo, LocationCode, ticket.Date, ticket.Time, ticket.StatusUpdatedTime, ticket.Status, ticket.UserID, ticket.LocationName, ticket.PictureLocation]).then(([tx, results]) => {
                  resolve(results);
                });
              }).then((result) => {
                this.closeDatabase(db);
              }).catch((err) => {
                console.log(err);
              });
            } else {
              console.log("else part........")
              db.transaction((tx) => {
                console.log("data for insert" + JSON.stringify(ticket))
                tx.executeSql('UPDATE tblTickets SET Status = ? WHERE LocationCode = ? AND TicketNo = ?', [ticket.Status, LocationCode, TicketNo]).then(([tx, results]) => {
                  resolve(results);
                });
              }).then((result) => {
                this.closeDatabase(db);
              }).catch((err) => {
                console.log(err);
              });
            }
          })
        }).then((result) => {
          this.closeDatabase(db);
        }).catch((err) => {
          console.log(err);
        });
      }).catch((err) => {
        console.log(err);
      });
    });
  }


  addSettingData(location) {
    return new Promise((resolve) => {
      this.initDB().then((db) => {
        db.transaction((tx) => {
          for (let i = 0; i < location.length; i++) {
            let row = location[i];
            console.log("obj........", JSON.stringify(row))
            tx.executeSql(`SELECT * FROM tblLocation WHERE LocationCode = '${row.LocationCode}' AND UserID = ${row.UserID}`).then(([tx, results]) => {
              resolve(results)
              console.log('selectResult:===' + results.rows.length);
              if (results.rows.length === 0) {
                db.transaction((tx) => {
                  console.log("data for insert ..........")
                  tx.executeSql('INSERT INTO tblLocation VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [row.Id, row.LocationCode, row.LocationName, row.Latitude, row.Longitude, row.SeaLevel_InMetres, 1, 100, row.IDGroups, row.IDCategory, 1, row.UserID]).then(([tx, results]) => {
                    resolve(results);
                  });
                }).then((result) => {
                  this.closeDatabase(db);
                }).catch((err) => {
                  console.log(err);
                });
              } else {
                db.transaction((tx) => {
                  tx.executeSql(`UPDATE tblLocation SET Id = ?, LocationName = ?, Latitude = ?, Longitude = ?, SeaLevel_InMetres = ?, IDGroups = ?, IDCategory = ?, WHERE LocationCode = ? AND UserID = ?`, [row.Id, row.LocationName, row.Latitude, row.Longitude, row.SeaLevel_InMetres,]).then(([tx, results]) => {
                    resolve(results);
                    // this.listSettingData()
                    //this.updatesTicketsStatus(LocationCode,Status,Id)
                  });
                  this.closeDatabase(db);
                }).then((result) => {
                  this.closeDatabase(db);
                }).catch((err) => {
                  console.log(err);
                });
                //   console.log("=====Resutl All Ready Avelable=======")
                //  console.log("========= else part ==========" )
                //  this.closeDatabase(db);
              }
            })
          }
        }).then((result) => {
          this.closeDatabase(db);
        }).catch((err) => {
          console.log(err);
        });
      }).catch((err) => {
        console.log(err);
      });
    });
  }


  listSettingData(Id) {
    return new Promise((resolve) => {
      const settingData = [];
      this.initDB().then((db) => {
        db.transaction((tx) => {
          tx.executeSql(`SELECT LocationCode, LocationName, Status, Radius, isNotification, Latitude, Longitude FROM tblLocation WHERE UserID = ${Id}`, []).then(([tx, results]) => {
            console.log("Query completed");
            var len = results.rows.length;
            for (let i = 0; i < len; i++) {
              let row = results.rows.item(i);
              console.log(`LocationCode: ${row.LocationCode}, LocationName: ${row.LocationName}`)
              const { LocationCode, LocationName, Status, isNotification, Radius, Latitude, Longitude } = row;
              settingData.push({
                LocationCode,
                LocationName,
                Status,
                Radius,
                isNotification,
                Latitude,
                Longitude
              });
            }
            // console.log("...............................",settingData);
            resolve(settingData);
          });
        }).then((result) => {
          this.closeDatabase(db);
        }).catch((err) => {
          console.log(err);
        });
      }).catch((err) => {
        console.log(err);
      });
    });
  }

  updatesSettingData(LocationCode, Status, Radius, isNotification, Id) {
    return new Promise((resolve) => {
      this.initDB().then((db) => {
        db.transaction((tx) => {
          tx.executeSql(`UPDATE tblLocation SET Status = ?, Radius = ?, isNotification = ? WHERE LocationCode = ? AND UserID = ?`, [Status, Radius, isNotification, LocationCode, Id]).then(([tx, results]) => {
            resolve(results);
            // this.listSettingData()
            //this.updatesTicketsStatus(LocationCode,Status,Id)
          });
          this.closeDatabase(db);
        }).then((result) => {
          this.closeDatabase(db);
        }).catch((err) => {
          console.log(err);
        });
      }).catch((err) => {
        console.log(err);
      });
    });
  }

  sendNotification(Id) {
    return new Promise((resolve) => {
      const arrLocation = [];
      this.initDB().then((db) => {
        db.transaction((tx) => {
          tx.executeSql(`SELECT Latitude, Longitude, Radius, isNotification, Status, LocationCode, LocationName FROM tblLocation WHERE Status = 1 AND UserID = ${Id}`, []).then(([tx, results]) => {
            console.log("location Query completed");
            var len = results.rows.length;
            for (let i = 0; i < len; i++) {
              let row = results.rows.item(i);
              console.log(`Latitude: ${row.Latitude}, Longitude: ${row.Longitude}`)
              const { Latitude, Longitude, Radius, isNotification, Status, LocationCode, LocationName } = row;
              arrLocation.push({
                Latitude,
                Longitude,
                Radius,
                isNotification,
                Status,
                LocationCode,
                LocationName
              });
            }
            //console.log("==============",arrLocation);
            resolve(arrLocation);
          });
        }).then((result) => {
          this.closeDatabase(db);
        }).catch((err) => {
          console.log('hello 1')
          console.log(err);
        });
      }).catch((err) => {
        console.log(err);
        console.log('hello 2')
      });
    });

  }

  // updatesTicketsStatus(LocationCode, Status, Id) {
  //   var locationCode = String();
  //   locationCode = LocationCode
  //   var Location = locationCode.trim()
  //   return new Promise((resolve) => {
  //     this.initDB().then((db) => {
  //       db.transaction((tx) => {
  //         tx.executeSql('UPDATE tblTickets SET Status = ? WHERE LocationCode = ? AND UserID = ?', [Status, Location, Id]).then(([tx, results]) => {
  //           resolve(results);
  //         });
  //         this.closeDatabase(db);
  //       }).then((result) => {
  //         this.closeDatabase(db);
  //       }).catch((err) => {
  //         console.log(err);
  //       });
  //     }).catch((err) => {
  //       console.log(err);
  //     });
  //   });
  // }

  addThroughNoti(row) {
    var valiDateFr = String()
    var valiDateto = String()
    var valiTimeFr = String()
    var valiTimeto = String()
    valiDateFr = row.ValidityDateFrom
    var dateFrom = valiDateFr.slice(0,10)
    valiDateto = row.ValidityDateTo
    var dateTo = valiDateto.slice(0,10)
    valiTimeFr = row.ValidityTimeFrom
    var timeFr = valiTimeFr.slice(11,19)
    valiTimeto = row.ValidityTimeTo
    var timeTo = valiTimeto.slice(11,19)
    return new Promise((resolve) => {
      this.initDB().then((db) => {
        db.transaction((tx) => {
          console.log("obj........", row)
          tx.executeSql(`SELECT * FROM tblGeoMessage WHERE LocationCode = '${row.LocationCode}' AND Id = ${row.Id}`).then(([tx, results]) => {
            resolve(results)
            if (results.rows.length === 0) {
              db.transaction((tx) => {
                console.log("data for insert ..........")
                tx.executeSql('INSERT INTO tblGeoMessage VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [row.Id, row.Message, row.LocationCode, dateFrom, timeFr, dateTo, timeTo, row.SentCounter, row.UserID, row.PictureLocation, 0, row.LocationName, row.IsVoucher, row.Redeemed, row.GroupSendRedeemed, row.IsPercentageDiscount, row.IsAmountDiscount, row.IsGift, row.FailedRedeemedAttempts, row.GroupFailedRedeemedAttempts]).then(([tx, results]) => {
                  resolve(results);
                });
              }).then((result) => {
                this.closeDatabase(db);
              }).catch((err) => {
                console.log(err);
              });
            } else {
              console.log("else part........")
              db.transaction((tx) => {
                console.log("data for insert" + JSON.stringify(ticket))
                tx.executeSql('UPDATE tblGeoMessage SET IsDeleted = ?, IsVoucher = ?, Redeemed = ?, GroupSendRedeemed = ?, IsPercentageDiscount = ?, IsAmountDiscount = ?, IsGift = ?, FailedRedeemedAttempts = ?, GroupFailedRedeemedAttempts = ? WHERE Id = ?', [row.IsDeleted, row.IsVoucher, row.Redeemed, row.GroupSendRedeemed, row.IsPercentageDiscount, row.IsAmountDiscount, row.IsGift, row.FailedRedeemedAttempts, row.GroupFailedRedeemedAttempts, row.Id]).then(([tx, results]) => {
                  resolve(results);
                });
              }).then((result) => {
                this.closeDatabase(db);
              }).catch((err) => {
                console.log(err);
              });
            }
          })
        }).then((result) => {
          this.closeDatabase(db);
        }).catch((err) => {
          console.log(err);
        });
      }).catch((err) => {
        console.log(err);
      });
    });
  }

  addGeoMessage(message) {
    var valiDateFr = String()
    var valiDateto = String()
    var valiTimeFr = String()
    var valiTimeto = String()
    return new Promise((resolve) => {
      this.initDB().then((db) => {
        db.transaction((tx) => {
          for (let i = 0; i < message.length; i++) {
            let row = message[i];
            valiDateFr = row.ValidityDateFrom
            var dateFrom = valiDateFr.slice(0,10)
            valiDateto = row.ValidityDateTo
            var dateTo = valiDateto.slice(0,10)
            valiTimeFr = row.ValidityTimeFrom
            var timeFr = valiTimeFr.slice(11,19)
            valiTimeto = row.ValidityTimeTo
            var timeTo = valiTimeto.slice(11,19)
            console.log("obj........", dateFrom,dateTo,timeFr,timeTo)
            tx.executeSql(`SELECT * FROM tblGeoMessage WHERE LocationCode = '${row.LocationCode}' AND Id = ${row.Id}`).then(([tx, results]) => {
              resolve(results)
              console.log('selectResult:===' + results.rows.length);
              if (results.rows.length === 0) {
                db.transaction((tx) => {
                  console.log("data for insert ..........")
                  tx.executeSql('INSERT INTO tblGeoMessage VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [row.Id, row.Message, row.LocationCode, dateFrom, timeFr, dateTo, timeTo, row.SentCounter, row.UserID, row.PictureLocation, 0, row.LocationName, row.IsVoucher, row.Redeemed, row.GroupSendRedeemed, row.IsPercentageDiscount, row.IsAmountDiscount, row.IsGift, row.FailedRedeemedAttempts, row.GroupFailedRedeemedAttempts]).then(([tx, results]) => {
                    resolve(results);
                  });
                }).then((result) => {
                  this.closeDatabase(db);
                }).catch((err) => {
                  console.log(err);
                });
              } else {
                console.log("message else part........")
              db.transaction((tx) => {
                console.log("update add data" + JSON.stringify(row))
                tx.executeSql('UPDATE tblGeoMessage SET IsDeleted = ?, IsVoucher = ?, Redeemed = ?, GroupSendRedeemed = ?, IsPercentageDiscount = ?, IsAmountDiscount = ?, IsGift = ?, FailedRedeemedAttempts = ?, GroupFailedRedeemedAttempts = ? WHERE Id = ?', [row.IsDeleted, row.IsVoucher, row.Redeemed, row.GroupSendRedeemed, row.IsPercentageDiscount, row.IsAmountDiscount, row.IsGift, row.FailedRedeemedAttempts, row.GroupFailedRedeemedAttempts, row.Id]).then(([tx, results]) => {
                  resolve(results);
                });
              }).then((result) => {
                this.closeDatabase(db);
              }).catch((err) => {
                console.log(err);
              });
              }
            })
          }
        }).then((result) => {
          this.closeDatabase(db);
        }).catch((err) => {
          console.log(err);
        });
      }).catch((err) => {
        console.log(err);
      });
    });
  }

  listGeoMessage(UserId) {
    var date = moment().format('YYYY-MM-DD')
    var time = moment().format('HH:mm:ss')
    console.log("datetime.....", date, time)
    var Date = date+" "+time
    return new Promise((resolve) => {
      const geoMessage = [];
      this.initDB().then((db) => {
        db.transaction((tx) => {
        // tx.executeSql(`SELECT Id, LocationCode, Message, ValidityDateFrom, ValidityTimeFrom, ValidityDateTo, ValidityTimeTo, SentCounter, PictureLocation, LocationName, UserID FROM tblGeoMessage WHERE (UserID = ${UserId} OR UserID IS NULL) AND IsDeleted = 0 AND '${date}' BETWEEN ValidityDateFrom AND ValidityDateTo AND '${time}' BETWEEN ValidityTimeFrom AND ValidityTimeTo ORDER BY ValidityDateFrom DESC`, []).then(([tx, results]) => {
          tx.executeSql(`SELECT Id, LocationCode, Message, ValidityDateFrom, ValidityTimeFrom, ValidityDateTo, ValidityTimeTo, SentCounter, PictureLocation, LocationName, IsVoucher, Redeemed, GroupSendRedeemed, IsPercentageDiscount, IsAmountDiscount, IsGift, FailedRedeemedAttempts, GroupFailedRedeemedAttempts, UserID FROM tblGeoMessage WHERE (UserID = ${UserId} OR UserID IS NULL) AND IsDeleted = 0 AND '${Date}' BETWEEN ValidityDateFrom || ' ' || ValidityTimeFrom AND ValidityDateTo || ' ' || ValidityTimeTo ORDER BY ValidityDateFrom DESC`, []).then(([tx, results]) => {
         console.log("Query completed");
            var len = results.rows.length;
            for (let i = 0; i < len; i++) {
              let row = results.rows.item(i);
              console.log(`LocationCodelist...: ${row.LocationCode}, Message: ${row.Message}`)
              const { Id, LocationCode, Message, ValidityDateFrom, ValidityTimeFrom, ValidityDateTo, ValidityTimeTo, SentCounter, PictureLocation, LocationName, IsVoucher, Redeemed, GroupSendRedeemed, IsPercentageDiscount, IsAmountDiscount, IsGift, FailedRedeemedAttempts, GroupFailedRedeemedAttempts, UserID } = row;
              geoMessage.push({
                Id,
                LocationCode,
                Message,
                ValidityDateFrom,
                ValidityTimeFrom,
                ValidityDateTo,
                ValidityTimeTo,
                SentCounter,
                PictureLocation,
                LocationName,
                IsVoucher,
                Redeemed,
                GroupSendRedeemed,
                IsPercentageDiscount, 
                IsAmountDiscount, 
                IsGift,
                FailedRedeemedAttempts,
                GroupFailedRedeemedAttempts,
                UserID
              });
            }
            resolve(geoMessage);
          });
        }).then((result) => {
          this.closeDatabase(db);
        }).catch((err) => {
          console.log(err);
        });
      }).catch((err) => {
        console.log(err);
      });
    });
  }

  updateOldNotification(isDelete, Id) {
    console.log("inside upadte delete")
    return new Promise((resolve) => {
      this.initDB().then((db) => {
        db.transaction((tx) => {
          tx.executeSql('UPDATE tblGeoMessage SET IsDeleted = ? WHERE Id = ?', [isDelete, Id]).then(([tx, results]) => {
            resolve(results);
          });
          // this.closeDatabase(db);
        }).then((result) => {
          this.closeDatabase(db);
        }).catch((err) => {
          console.log(err);
        });
      }).catch((err) => {
        console.log(err);
      });
    });
  }

  deleteGeoMessageTbl() {
    console.log("inside delete.......")
    return new Promise((resolve) => {
      this.initDB().then((db) => {
        db.transaction((tx) => {
          tx.executeSql('DELETE FROM tblGeoMessage', []).then(([tx, results]) => {
            resolve(results);
          });
          // this.closeDatabase(db);
        }).then((result) => {
          this.closeDatabase(db);
        }).catch((err) => {
          console.log(err);
        });
      }).catch((err) => {
        console.log(err);
      });
    });
  }


}